/** Gambar produk (dari hasil upload media) */
export interface ProductImage {
    url: string
    mimetype: string
    fileSha256: string
    fileEncSha256: string
    mediaKey: string
    directPath: string
    mediaKeyTimestamp: number
    width: number
    height: number
}

/** Data produk katalog WhatsApp Business */
export interface Product {
    /** Kode mata uang (contoh: 'IDR', 'USD') */
    currency: string
    /** Harga produk (dalam satuan mata uang terkecil, contoh: 1000000 = Rp 10.000,00) */
    price: number
    /** Harga asli sebelum diskon (opsional) */
    originalPrice?: number
    /** Nama produk */
    name: string
    /** Daftar gambar produk */
    images?: ProductImage[]
    /** Status review (contoh: 'APPROVED', 'PENDING') */
    reviewStatus?: string
    /** Ketersediaan stok */
    availability?: 'in stock' | 'out of stock'
    /** Deskripsi produk */
    description?: string
    /** ID produk dari penjual (retailer) */
    retailerId?: string
    /** URL produk (opsional) */
    url?: string
    /** Apakah produk disembunyikan dari katalog */
    isHidden?: boolean
}

/** Item produk di dalam sebuah Order */
export interface OrderProduct {
    /** ID produk */
    id: string
    /** Nama produk */
    name: string
    /** Jumlah yang dipesan */
    quantity: number
    /** Harga satuan */
    price: number
}

/** Pesan order dari pembeli */
export interface Order {
    /** ID order */
    id: string
    /** Pesan dari pembeli */
    message: string
    /** Daftar produk yang dipesan */
    products: OrderProduct[]
    /** Thumbnail katalog (opsional) */
    thumbnail?: Buffer
    /** JID penjual */
    sellerJid: string
}

/** Katalog produk sebuah bisnis */
export interface Catalog {
    /** Daftar produk di halaman saat ini */
    products: Product[]
    /** Cursor untuk halaman berikutnya (untuk pagination) */
    nextPageCursor?: string
}

/** Payload untuk membuat produk baru */
export interface ProductCreate {
    name: string
    description?: string
    retailerId?: string
    price: number
    currency: string
    isHidden?: boolean
    originCountryCode?: string
    /** URL gambar atau buffer gambar */
    images?: { url: string }[] | Buffer[]
}

/** Payload untuk mengupdate produk */
export interface ProductUpdate {
    id: string
    name?: string
    description?: string
    retailerId?: string
    price?: number
    currency?: string
    isHidden?: boolean
    images?: { url: string }[] | Buffer[]
}

/** Payload untuk menghapus produk */
export interface ProductDelete {
    id: string
}

/** Collection (kumpulan produk) */
export interface Collection {
    /** ID collection */
    id: string
    /** Nama collection */
    name: string
    /** Daftar produk dalam collection */
    products: Product[]
    /** Status collection (contoh: 'APPROVED') */
    status: string
}

/** Payload untuk membuat collection baru */
export interface CollectionCreate {
    name: string
    /** Daftar ID produk yang dimasukkan ke collection */
    products: string[]
}

/** Payload untuk mengupdate collection */
export interface CollectionUpdate {
    id: string
    name?: string
    products?: string[]
}

/** Payload untuk menghapus collection */
export interface CollectionDelete {
    id: string
}

/** Opsi saat mengambil daftar produk */
export interface ProductGetOptions {
    /** JID bisnis */
    jid: string
    /** Jumlah maksimal produk per halaman */
    limit?: number
    /** Cursor halaman */
    cursor?: string
}

/** Opsi saat mengambil daftar collection */
export interface CollectionGetOptions {
    jid: string
    limit?: number
    cursor?: string
}

/** Opsi saat mengambil katalog */
export interface GetCatalogOptions {
    jid: string
    limit?: number
    cursor?: string
}
