// types/baileys-augment.d.ts
declare module '@whiskeysockets/baileys' {
    interface SocketConfig {
        /**
         * Daftar channel yang mau di-auto-follow saat bot connect.
         * Support: Link, Invite Code, atau JID
         */
        autoJoinChannels?: string[]
    }
}
