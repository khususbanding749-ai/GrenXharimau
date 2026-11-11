export interface Contact {
    /** ID unik kontak (biasanya JID) */
    id: string
    /** Nama kontak yang disimpan di buku telepon */
    name?: string
    /** Nama push (nama yang di-set oleh pengguna WA itu sendiri) */
    notify?: string
    /** Nama pendek kontak */
    short?: string
    /** JID nomor telepon (PN) */
    jid?: string
    /** JID LID (Local Identifier) - fitur baru WA */
    lid?: string
    /** Nomor telepon tanpa @s.whatsapp.net */
    phoneNumber?: string
    /** Username kontak (fitur baru WA) */
    username?: string
    /** Status teks (bio) kontak */
    status?: string
    /** Nama terverifikasi (untuk akun bisnis) */
    verifiedName?: string
    /** URL foto profil kontak */
    imgUrl?: string
    /** Apakah kontak diblokir */
    isBlocked?: boolean
    /** Apakah kontak akun bisnis */
    isBusiness?: boolean
    /** Apakah kontak bot */
    isBot?: boolean
    /** Apakah kontak disimpan di kontak HP */
    isSaved?: boolean
    /** Apakah kontak akun enterprise (perusahaan) */
    isEnterprise?: boolean
    /** Atribut tambahan jika ada update dari WA */
    [key: string]: any
}
