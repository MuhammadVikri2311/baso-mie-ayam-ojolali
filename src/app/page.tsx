import Link from 'next/link'
import { db } from '@/lib/db'
import { getPublicStoreConfig } from '@/lib/systemConfig'
import { ProductCard } from '@/components/ProductCard'
import { OperationalHours } from '@/components/OperationalHours'
import {
  Utensils,
  MapPin,
  Phone,
  MessageCircle,
  ArrowRight,
  Flame,
  Soup,
  Coffee,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Ambil beberapa menu unggulan untuk ditampilkan di preview Home
  const featuredProducts = await db.product.findMany({
    where: {
      isAvailable: true,
      name: {
        in: [
          'Bakso Rusuk',
          'Bakso Urat',
          'Mie Ayam Bakso Urat',
          'Es Jeruk Peras',
        ],
      },
    },
    include: {
      category: true,
    },
    take: 4,
  })

  // Fallback jika menu spesifik belum ada
  const displayProducts =
    featuredProducts.length > 0
      ? featuredProducts
      : await db.product.findMany({
          where: { isAvailable: true },
          include: { category: true },
          take: 4,
        })

  const storeConfig = await getPublicStoreConfig()
  const rawPhone = storeConfig.storePhone.replace(/\D/g, '')
  const waPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    storeConfig.storeAddress ||
      'Jl. Gn. Galunggung Permai, Perumnas, No. 25 RT. 07 RW. 16, Kota Cirebon, Jawa Barat (Samping SD. Ciremai Giri)'
  )}`

  return (
    <div className="space-y-16 sm:space-y-24 pb-12">
      {/* ========================================================
          A. HERO SECTION
         ======================================================== */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-600/15">
        {/* Background decorative patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-orange-950 blur-3xl"></div>
        </div>

        <div className="relative px-6 py-12 sm:px-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-semibold tracking-wide border border-white/20">
                <Utensils className="w-4 h-4 text-orange-200" />
                <span>Kuliner Favorit Kota Cirebon</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                {storeConfig.storeName}
              </h1>

              <p className="text-base sm:text-lg text-orange-50/95 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                {storeConfig.storeDescription}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <Link
                  href="/menu"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-orange-600 font-bold text-base hover:bg-orange-50 hover:shadow-lg hover:shadow-white/20 transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>Lihat Menu</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-orange-700/60 hover:bg-orange-700/80 text-white font-semibold text-base border border-white/20 backdrop-blur-md transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-300" />
                  <span>Hubungi via WhatsApp</span>
                </a>
              </div>

              {/* Quick Info Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-orange-100 font-medium">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      storeConfig.isOpen ? 'bg-emerald-300' : 'bg-rose-400'
                    }`}
                  />
                  <span>{storeConfig.isOpen ? 'Buka Sekarang' : 'Tutup Sementara'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-200" />
                  <span>Daging Sapi Asli</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-200" />
                  <span>{storeConfig.openingHours}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Food Showcase */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Main Featured Food Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 bg-stone-900 group">
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src="/images/menu/baso-urat.jpg"
                      alt="Baso Ojolali"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
                      Menu Favorit
                    </span>
                    <h3 className="font-bold text-lg sm:text-xl text-white">
                      Bakso Urat &amp; Aneka Pilihan
                    </h3>
                    <p className="text-xs text-stone-200 mt-1 line-clamp-2">
                      Bakso sapi dengan tekstur urat mantap dan kuah kaldu sapi kaya rasa.
                    </p>
                  </div>
                </div>


                {/* Floating Accent Badge: Level Pedas */}
                <div className="absolute -top-4 -right-2 sm:-right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-orange-200/50 flex items-center gap-2 text-stone-900">
                  <Flame className="w-4 h-4 text-orange-600 fill-orange-600" />
                  <span className="text-xs font-bold text-stone-800">
                    Pilihan Bakso Mercon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          B. TENTANG KAMI
         ======================================================== */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold tracking-wide uppercase">
            <span>Tentang Usaha</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Kenikmatan Hidangan di Baso &amp; Mie Ayam Ojolali
          </h2>
          <p className="text-base text-stone-600 leading-relaxed">
            Baso &amp; Mie Ayam Ojolali adalah usaha kuliner UMKM di Kota Cirebon yang berfokus menyajikan olahan bakso sapi asli, mie ayam gurih, dan aneka minuman segar. Seluruh hidangan kami disajikan dengan bahan-bahan pilihan yang bersih, hangat, dan ramah di kantong.
          </p>
        </div>

        {/* 3 Kategori Utama Berdasarkan Menu Website */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Aneka Bakso */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-5">
                <Soup className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">
                Aneka Varian Bakso Sapi
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed mb-4">
                Pilihan bakso sapi beragam sesuai selera Anda: mulai dari <strong>Bakso Rusuk</strong> dengan potongan tulang rusuk sapi gurih, <strong>Bakso Tetelan</strong>, <strong>Bakso Balungan</strong>, <strong>Bakso Urat</strong> bertekstur mantap, <strong>Bakso Telor</strong>, <strong>Bakso Daging</strong> halus, hingga <strong>Bakso Mercon</strong> pedas yang menggugah selera.
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100 text-xs text-orange-600 font-semibold flex items-center gap-1">
              <span>Tersedia porsi kombinasi favorit</span>
            </div>
          </div>

          {/* Card 2: Aneka Mie Ayam */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">
                Mie Ayam Gurih Lezat
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed mb-4">
                Menyajikan <strong>Mie Ayam Biasa</strong> klasik yang lezat, <strong>Mie Ayam Ceker</strong> dengan olahan ceker lembut berbumbu, serta perpaduan komplit <strong>Mie Ayam Bakso</strong> dengan pilihan bakso urat, telur, mercon, daging, maupun bakso kecil.
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100 text-xs text-amber-700 font-semibold flex items-center gap-1">
              <span>Bumbu ayam gurih racikan khas</span>
            </div>
          </div>

          {/* Card 3: Minuman & Kustomisasi */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Coffee className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">
                Minuman Segar &amp; Kustomisasi
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed mb-4">
                Lengkapi santapan Anda dengan aneka minuman dingin maupun hangat: <strong>Es Jeruk Peras asli</strong>, <strong>Es Teh Manis</strong>, Teh Botol Sosro, Fruit Tea, Tebs, Kopi Good Day, hingga air mineral. Anda juga leluasa memilih jenis mie (kuning/bihun) dan tingkat kepedasan.
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100 text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <span>Bebas atur level pedas &amp; catatan pesanan</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          PREVIEW MENU UNGGULAN
         ======================================================== */}
      {displayProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Pilihan Populer
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                Menu Unggulan Ojolali
              </h2>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 hover:gap-3 transition-all"
            >
              <span>Lihat Semua Menu</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          C & D. ALAMAT USAHA & JAM OPERASIONAL
         ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Alamat Usaha (C) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm">
              <MapPin className="w-5 h-5 text-orange-600" />
              <span>Lokasi Usaha</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
              Alamat Kedai
            </h3>

            <p className="text-stone-700 text-sm sm:text-base leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200/60 font-medium">
              {storeConfig.storeAddress}
            </p>

            <div className="space-y-2 text-xs sm:text-sm text-stone-500 pt-1">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Patokan: Tepat di samping SD. Ciremai Giri</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Area Perumnas Galunggung, Kota Cirebon</span>
              </p>
            </div>
          </div>

          {/* Tombol Lihat Lokasi Google Maps */}
          <div className="pt-6 mt-6 border-t border-stone-100">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm transition-all duration-200 shadow-sm hover:shadow"
            >
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>Lihat Lokasi di Google Maps</span>
              <ExternalLink className="w-4 h-4 text-stone-400" />
            </a>
          </div>
        </div>

        {/* Kolom Kanan: Jam Operasional (D) */}
        <div className="lg:col-span-7">
          <OperationalHours />
        </div>
      </section>

      {/* ========================================================
          E. KONTAK DAN PEMESANAN
         ======================================================== */}
      <section className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-3xl p-6 sm:p-10 border border-orange-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-200/70 text-orange-800 text-xs font-bold uppercase tracking-wide">
              <Phone className="w-3.5 h-3.5" />
              <span>Kontak &amp; Pemesanan</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Ingin Memesan atau Menghubungi Kami?
            </h3>
            <p className="text-sm sm:text-base text-stone-600 max-w-xl">
              Anda dapat memesan langsung secara online melalui halaman Menu website ini, atau menghubungi kami langsung via WhatsApp untuk pertanyaan katering atau pesanan khusus.
            </p>
            <div className="pt-1">
              <span className="text-xs text-stone-500">Nomor Resmi WhatsApp: </span>
              <span className="font-extrabold text-stone-900 text-base sm:text-lg tracking-wide">
                {storeConfig.storePhone}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto flex-shrink-0">
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Hubungi via WhatsApp</span>
            </a>

            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-600/20 transition-all duration-200"
            >
              <Utensils className="w-4 h-4" />
              <span>Pesan Lewat Website</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
