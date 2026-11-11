/**
 * Auto follow channel (support Link, Invite Code, atau JID)
 */
export async function autoJoinChannel(sock, channelInput) {
    try {
        if (typeof sock.newsletterFollow !== 'function') {
            console.warn('[CHANNEL] Fitur newsletter tidak tersedia')
            return { status: 'unsupported' }
        }

        let channelJid = channelInput

        if (channelInput.includes('whatsapp.com/channel/')) {
            const match = channelInput.match(/whatsapp\.com\/channel\/([a-zA-Z0-9]+)/)
            if (!match) throw new Error('Format link channel tidak valid')

            const inviteCode = match[1]
            const meta = await sock.newsletterMetadata('invite', inviteCode)
            channelJid = meta.id
        } else if (!channelInput.endsWith('@newsletter')) {
            const meta = await sock.newsletterMetadata('invite', channelInput)
            channelJid = meta.id
        }

        const metadata = await sock.newsletterMetadata('jid', channelJid)

        if (metadata?.viewer_metadata?.role) {
            return { status: 'already_following', metadata }
        }

        await sock.newsletterFollow(channelJid)
        return { status: 'followed', metadata }
    } catch (error) {
        console.error(`[CHANNEL] Gagal follow ${channelInput}: ${error.message}`)
        return { status: 'error', error: error.message }
    }
}

/**
 * Loop banyak channel sekaligus dengan delay anti-spam
 */
export async function autoJoinChannels(sock, channels, logger) {
    if (!Array.isArray(channels) || !channels.length) return

    logger?.info({ count: channels.length }, 'starting auto-join channels')

    for (const channel of channels) {
        const result = await autoJoinChannel(sock, channel)
        logger?.info({ channel, status: result.status }, 'auto-join result')
        // Delay 2 detik tiap channel biar gak kena spam detection
        await new Promise(r => setTimeout(r, 2000))
    }

    logger?.info('auto-join channels finished')
}
