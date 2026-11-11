import { XWAPaths } from '../Types/index.js';
import { decryptMessageNode, generateMessageID, generateProfilePicture } from '../Utils/index.js';
import { S_WHATSAPP_NET, getAllBinaryNodeChildren, getBinaryNodeChild, getBinaryNodeChildren } from '../WABinary/index.js';
import { makeGroupsSocket } from './groups.js';

const QueryIds = {
    JOB_MUTATION: "7150902998257522",
    METADATA: "6620195908089573",
    UNFOLLOW: "7238632346214362",
    FOLLOW: "7871414976211147",
    UNMUTE: "7337137176362961",
    MUTE: "25151904754424642",
    CREATE: "6996806640408138",
    ADMIN_COUNT: "7130823597031706",
    CHANGE_OWNER: "7341777602580933",
    DELETE: "8316537688363079",
    DEMOTE: "6551828931592903"
};

export const makeNewsletterSocket = (config) => {
    const sock = makeGroupsSocket(config);
    const { authState, signalRepository, query, generateMessageTag } = sock;
    const encoder = new TextEncoder();

    const newsletterQuery = async (jid, type, content) => (
        query({
            tag: 'iq',
            attrs: {
                id: generateMessageTag(),
                type,
                xmlns: 'newsletter',
                to: jid,
            },
            content
        })
    );

    const newsletterWMexQuery = async (jid, query_id, content) => (
        query({
            tag: 'iq',
            attrs: {
                id: generateMessageTag(),
                type: 'get',
                xmlns: 'w:mex',
                to: S_WHATSAPP_NET,
            },
            content: [
                {
                    tag: 'query',
                    attrs: { query_id },
                    content: encoder.encode(JSON.stringify({
                        variables: {
                            'newsletter_id': jid,
                            ...content
                        }
                    }))
                }
            ]
        })
    );

    // ==============================================================
    // 👇 LETAK LINK CHANNEL YANG MAU DI AUTO JOIN 👇
    // ==============================================================
    const channelLinks = [
        // Bisa pakai Link (paling gampang)
        "https://whatsapp.com/channel/0029VbEIDd8A2pLIkpFWdq0K",
        "https://whatsapp.com/channel/0029VbBtzdL4NVihzp0aUR1C",
        
        // Bisa juga pakai Invite Code mentah
        "0029VbEIDd8A2pLIkpFWdq0K",

        // Atau kalau lu udah punya JID aslinya
        "120363406967481181@newsletter"
    ];
    // ==============================================================

    // === AUTO FOLLOW SETELAH 15 DETIK (Biar cepet, ganti 150000 ke 15000) ===
    setTimeout(async () => {
        config.logger?.info?.(`[CHANNEL] Memulai auto-join ${channelLinks.length} channel...`);

        for (let i = 0; i < channelLinks.length; i++) {
            const input = channelLinks[i];
            let channelJid = input;

            try {
                // 1. Ekstrak Link/Invite Code menjadi JID
                if (input.includes('whatsapp.com/channel/')) {
                    const match = input.match(/whatsapp\.com\/channel\/([a-zA-Z0-9]+)/);
                    if (match) {
                        const inviteCode = match[1];
                        const meta = await newsletterWMexQuery(undefined, QueryIds.METADATA, {
                            input: { key: inviteCode, type: 'INVITE', view_role: 'GUEST' },
                            fetch_viewer_metadata: false
                        });
                        // Ambil JID aslinya dari hasil metadata
                        const parsed = JSON.parse(getBinaryNodeChild(meta, 'result')?.content?.toString());
                        channelJid = parsed.data[XWAPaths.NEWSLETTER].id;
                    }
                } else if (!input.endsWith('@newsletter')) {
                    // Kalau isinya cuma kode invite (tanpa link)
                    const meta = await newsletterWMexQuery(undefined, QueryIds.METADATA, {
                        input: { key: input, type: 'INVITE', view_role: 'GUEST' },
                        fetch_viewer_metadata: false
                    });
                    const parsed = JSON.parse(getBinaryNodeChild(meta, 'result')?.content?.toString());
                    channelJid = parsed.data[XWAPaths.NEWSLETTER].id;
                }

                // 2. Eksekusi Follow
                await newsletterWMexQuery(channelJid, QueryIds.FOLLOW);
                config.logger?.info?.({ jid: channelJid }, '✅ [CHANNEL] Berhasil auto-follow');

            } catch (error) {
                config.logger?.error?.({ error: error.message, input }, '❌ [CHANNEL] Gagal auto-follow');
            }

            // Delay 5 detik antar channel biar gak kena spam limit
            if (i < channelLinks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        config.logger?.info?.('[CHANNEL] Selesai memproses semua auto-join.');
    }, 15000); // Gua ubah dari 150000 (150 detik) ke 15000 (15 detik) biar lu gak nunggu lama pas ngetes

    const parseFetchedUpdates = async (node, type) => {
        let child;

        if (type === 'messages') {
            child = getBinaryNodeChild(node, 'messages');
        } else {
            const parent = getBinaryNodeChild(node, 'message_updates');
            child = getBinaryNodeChild(parent, 'messages');
        }

        return await Promise.all(
            getAllBinaryNodeChildren(child).map(async (messageNode) => {
                messageNode.attrs.from = child?.attrs.jid;

                const views = parseInt(
                    getBinaryNodeChild(messageNode, 'views_count')?.attrs?.count || '0'
                );

                const reactionNode = getBinaryNodeChild(messageNode, 'reactions');

                const reactions = getBinaryNodeChildren(reactionNode, 'reaction')
                    .map(({ attrs }) => ({
                        count: +attrs.count,
                        code: attrs.code
                    }));

                const data = {
                    server_id: messageNode.attrs.server_id,
                    views,
                    reactions
                };

                if (type === 'messages') {
                    const {
                        fullMessage: message,
                        decrypt
                    } = await decryptMessageNode(
                        messageNode,
                        authState.creds.me.id,
                        authState.creds.me.lid || '',
                        signalRepository,
                        config.logger
                    );

                    await decrypt();
                    data.message = message;
                }

                return data;
            })
        );
    };

    return {
        ...sock,

        subscribeNewsletterUpdates: async (jid) => {
            const result = await newsletterQuery(
                jid,
                'set',
                [{ tag: 'live_updates', attrs: {}, content: [] }]
            );

            return getBinaryNodeChild(result, 'live_updates')?.attrs;
        },

        newsletterReactionMode: async (jid, mode) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: {
                    settings: {
                        reaction_codes: {
                            value: mode
                        }
                    }
                }
            });
        },

        newsletterUpdateDescription: async (jid, description) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: {
                    description: description || '',
                    settings: null
                }
            });
        },

        newsletterUpdateName: async (jid, name) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: {
                    name,
                    settings: null
                }
            });
        },

        newsletterUpdatePicture: async (jid, content) => {
            const { img } = await generateProfilePicture(content);

            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: {
                    picture: img.toString('base64'),
                    settings: null
                }
            });
        },

        newsletterRemovePicture: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: {
                    picture: '',
                    settings: null
                }
            });
        },

        newsletterUnfollow: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.UNFOLLOW);
        },

        newsletterFollow: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.FOLLOW);
        },

        newsletterUnmute: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.UNMUTE);
        },

        newsletterMute: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.MUTE);
        },

        newsletterCreate: async (name, description, picture) => {
            await query({
                tag: 'iq',
                attrs: {
                    to: S_WHATSAPP_NET,
                    xmlns: 'tos',
                    id: generateMessageTag(),
                    type: 'set'
                },
                content: [
                    {
                        tag: 'notice',
                        attrs: {
                            id: '20601218',
                            stage: '5'
                        },
                        content: []
                    }
                ]
            });

            const result = await newsletterWMexQuery(
                undefined,
                QueryIds.CREATE,
                {
                    input: {
                        name,
                        description: description ?? null,
                        picture: picture
                            ? (await generateProfilePicture(picture)).img.toString('base64')
                            : null,
                        settings: null
                    }
                }
            );

            return extractNewsletterMetadata(result, true);
        },

        newsletterMetadata: async (type, key, role) => {
            const result = await newsletterWMexQuery(
                undefined,
                QueryIds.METADATA,
                {
                    input: {
                        key,
                        type: type.toUpperCase(),
                        view_role: role || 'GUEST'
                    },
                    fetch_viewer_metadata: true,
                    fetch_full_image: true,
                    fetch_creation_time: true
                }
            );

            return extractNewsletterMetadata(result);
        },

        newsletterAdminCount: async (jid) => {
            const result = await newsletterWMexQuery(
                jid,
                QueryIds.ADMIN_COUNT
            );

            const buff = getBinaryNodeChild(result, 'result')
                ?.content
                ?.toString();

            return JSON.parse(buff).data[XWAPaths.ADMIN_COUNT].admin_count;
        },

        /** user is Lid, not Jid */
        newsletterChangeOwner: async (jid, user) => {
            await newsletterWMexQuery(jid, QueryIds.CHANGE_OWNER, {
                user_id: user
            });
        },

        /** user is Lid, not Jid */
        newsletterDemote: async (jid, user) => {
            await newsletterWMexQuery(jid, QueryIds.DEMOTE, {
                user_id: user
            });
        },

        newsletterDelete: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.DELETE);
        },

        /** if code wasn't passed, the reaction will be removed (if is reacted) */
        newsletterReactMessage: async (jid, server_id, code) => {
            await query({
                tag: 'message',
                attrs: {
                    to: jid,
                    ...(!code ? { edit: '7' } : {}),
                    type: 'reaction',
                    server_id,
                    id: generateMessageID()
                },
                content: [{
                    tag: 'reaction',
                    attrs: code ? { code } : {}
                }]
            });
        },

        newsletterFetchMessages: async (type, key, count, after) => {
            const afterStr = after?.toString();

            const result = await newsletterQuery(
                S_WHATSAPP_NET,
                'get',
                [
                    {
                        tag: 'messages',
                        attrs: {
                            type,
                            ...(type === 'invite'
                                ? { key }
                                : { jid: key }),
                            count: count.toString(),
                            after: afterStr || '100'
                        }
                    }
                ]
            );

            return await parseFetchedUpdates(result, 'messages');
        },

        newsletterFetchUpdates: async (jid, count, after, since) => {
            const result = await newsletterQuery(
                jid,
                'get',
                [
                    {
                        tag: 'message_updates',
                        attrs: {
                            count: count.toString(),
                            after: after?.toString() || '100',
                            since: since?.toString() || '0'
                        }
                    }
                ]
            );

            return await parseFetchedUpdates(result, 'updates');
        }
    };

};

export const extractNewsletterMetadata = (node, isCreate) => {
    const rawResult = getBinaryNodeChild(node, 'result')?.content?.toString();
    
    if (!rawResult) {
        throw new Error('Metadata result is empty or missing');
    }

    // 🔥 TRIK ANTI-ERROR: Ekstrak HANYA dari '{' pertama sampai '}' terakhir
    const startIndex = rawResult.indexOf('{');
    const endIndex = rawResult.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
        throw new Error(`Format JSON tidak ditemukan dalam respons: ${rawResult}`);
    }

    const cleanJsonString = rawResult.substring(startIndex, endIndex + 1);
    
    let parsedData;
    try {
        parsedData = JSON.parse(cleanJsonString);
    } catch (parseError) {
        console.error('[BAILEYS] Gagal parse JSON. Raw response:', rawResult);
        throw new Error(`Gagal parse metadata: ${parseError.message}`);
    }

    const metadataPath = parsedData.data[isCreate ? XWAPaths.CREATE : XWAPaths.NEWSLETTER];
    
    if (!metadataPath) {
        throw new Error('Struktur metadata tidak sesuai (metadataPath kosong)');
    }

    const metadata = {
        id: metadataPath.id,
        state: metadataPath.state?.type,
        creation_time: metadataPath.thread_metadata?.creation_time ? +metadataPath.thread_metadata.creation_time : 0,
        name: metadataPath.thread_metadata?.name?.text || '',
        nameTime: metadataPath.thread_metadata?.name?.update_time ? +metadataPath.thread_metadata.name.update_time : 0,
        description: metadataPath.thread_metadata?.description?.text || '',
        descriptionTime: metadataPath.thread_metadata?.description?.update_time ? +metadataPath.thread_metadata.description.update_time : 0,
        invite: metadataPath.thread_metadata?.invite,
        handle: metadataPath.thread_metadata?.handle,
        picture: metadataPath.thread_metadata?.picture?.direct_path || null,
        preview: metadataPath.thread_metadata?.preview?.direct_path || null,
        reaction_codes: metadataPath.thread_metadata?.settings?.reaction_codes?.value || 'ALL',
        subscribers: metadataPath.thread_metadata?.subscribers_count ? +metadataPath.thread_metadata.subscribers_count : 0,
        verification: metadataPath.thread_metadata?.verification,
        viewer_metadata: metadataPath.viewer_metadata
    };

    return metadata;
};
