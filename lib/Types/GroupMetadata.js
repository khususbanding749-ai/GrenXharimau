export interface GroupMetadata {
    /** ID unik grup (format JID) */
    id: string
    /** Menentukan apakah grup menggunakan 'lid' atau 'pn' untuk pengiriman pesan */
    addressingMode?: 'lid' | 'pn'
    /** Nama atau subjek grup */
    subject: string
    /** JID pembuat grup */
    owner: string | undefined
    /** JID pemilik nomor telepon pembuat grup (opsional) */
    ownerPn?: string
    /** Username pembuat grup (opsional) */
    ownerUsername?: string
    /** Kode negara pembuat grup (opsional) */
    owner_country_code?: string
    /** Waktu pembuatan grup dalam Unix timestamp */
    creation?: number
    /** Deskripsi grup */
    desc?: string
    /** ID deskripsi grup */
    descId?: string
    /** JID pengubah deskripsi terakhir */
    descOwner?: string
    /** JID nomor telepon pengubah deskripsi */
    descOwnerPn?: string
    /** Username pengubah deskripsi */
    descOwnerUsername?: string
    /** Waktu deskripsi terakhir diubah */
    descTime?: number
    /** JID pengubah subjek grup terakhir */
    subjectOwner?: string
    /** JID nomor telepon pengubah subjek */
    subjectOwnerPn?: string
    /** Username pengubah subjek */
    subjectOwnerUsername?: string
    /** Waktu subjek terakhir diubah */
    subjectTime?: number
    /** Jumlah anggota grup */
    size?: number
    /** Daftar participant (anggota) grup */
    participants: GroupParticipant[]
    /** Menandakan grup hanya mengizinkan admin untuk mengirim pesan */
    announce?: boolean
    /** Menandakan pengaturan grup dikunci (hanya admin yang bisa mengubah) */
    restrict?: boolean
    /** Menandakan anggota biasa diizinkan menambahkan participant lain */
    memberAddMode?: boolean
    /** Menandakan diperlukan persetujuan untuk bergabung */
    joinApprovalMode?: boolean
    /** Durasi pesan sementara (ephemeral) dalam detik */
    ephemeralDuration?: number
    /** JID komunitas induk jika grup ini bagian dari komunitas */
    linkedParent?: string
    /** Menandakan apakah ini sebuah komunitas */
    isCommunity?: boolean
    /** Menandakan apakah ini pengumuman komunitas */
    isCommunityAnnounce?: boolean
    /** Kode undangan grup (jika ada) */
    inviteCode?: string
    /** JID orang yang menambahkanmu ke grup atau mengubah pengaturan */
    author?: string
    /** JID nomor telepon author */
    authorPn?: string
    /** Username author */
    authorUsername?: string
}

export interface GroupParticipant {
    /** ID unik participant (JID) */
    id: string
    /** JID nomor telepon participant (opsional) */
    phoneNumber?: string
    /** Username participant (opsional) */
    username?: string
    /** Status admin participant (null jika anggota biasa) */
    admin: 'admin' | 'superadmin' | null
}

/** Tipe aksi yang bisa diterapkan ke participant grup */
export type ParticipantAction = 'add' | 'remove' | 'promote' | 'demote' | 'modify'

/** Tipe metode permintaan bergabung ke grup */
export type RequestJoinMethod = 'invite_link' | 'linked_group_join' | 'non_admin'
