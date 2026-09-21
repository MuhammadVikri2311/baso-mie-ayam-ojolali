import Link from 'next/link'
import { ArrowRight, Star, Utensils, Coffee, Plus, Soup, MapPin, Clock, Phone } from 'lucide-react'
import { db } from '@/lib/db'
import { ProductCard } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const popularProducts = await db.product.findMany({
    where: { isAvailable: true },
    take: 3,
    include: {
      category: true
    }
  })

  return (
    <div className="flex flex-col gap-16 pb-0">
      
      {/* 1. HERO SECTION (Split Layout) */}
      <section className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 shadow-sm border border-orange-100 relative overflow-hidden mt-4">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left z-10">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-stone-900 mb-6 tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Baso & Mie Ayam</span>
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 mb-10 leading-relaxed max-w-xl">
              Warisan resep keluarga sejak bertahun-tahun lalu. Rasakan sensasi kuah kaldu sapi asli dengan tekstur baso urat yang menggugah selera di UMKM Ojolali.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/menu" className="inline-flex justify-center items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-orange-700 hover:to-orange-600 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300">
                Pesan Sekarang <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
          <div className="relative z-10 hidden lg:flex justify-center items-center">
            {/* Visual Food Placeholder */}
            <div className="relative w-full aspect-square max-w-md bg-gradient-to-tr from-orange-200 to-red-100 rounded-full p-2 shadow-2xl flex items-center justify-center border-8 border-white/50">
               <div className="absolute inset-0 bg-white/20 rounded-full animate-[spin_60s_linear_infinite] border-4 border-dashed border-orange-300"></div>
               <Utensils className="w-48 h-48 text-orange-500/80 absolute drop-shadow-lg" />
            </div>
            {/* Decorative Floating Elements */}
            <div className="absolute top-10 right-10 bg-white p-4 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
              <span className="text-2xl font-bold text-orange-600">100%</span>
              <p className="text-xs text-stone-500 font-medium">Daging Sapi Asli</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Kategori Pilihan</h2>
          <p className="text-stone-500 mt-2 text-lg">Pilih menu sesuai selera Anda hari ini</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/menu" className="group bg-white border border-stone-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-600 transition-colors duration-300">
              <Utensils className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-stone-800 text-lg group-hover:text-orange-600 transition-colors">Baso</span>
          </Link>
          <Link href="/menu" className="group bg-white border border-stone-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-orange-600 transition-colors duration-300">
              <Soup className="w-8 h-8 text-amber-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-stone-800 text-lg group-hover:text-orange-600 transition-colors">Mie Ayam</span>
          </Link>
          <Link href="/menu" className="group bg-white border border-stone-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-orange-600 transition-colors duration-300">
              <Coffee className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-stone-800 text-lg group-hover:text-orange-600 transition-colors">Minuman</span>
          </Link>
        </div>
      </section>

      {/* 3. POPULAR MENU SECTION */}
      <section className="px-4 bg-stone-50/50 py-8 rounded-[3rem]">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">Menu Favorit</h2>
            <p className="text-stone-500 mt-2 text-lg">Menu andalan yang paling sering dipesan</p>
          </div>
          <Link href="/menu" className="text-orange-600 font-medium hover:text-orange-700 hidden sm:flex items-center gap-1 hover:-translate-x-1 transition-transform">
            Lihat Semua Menu &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <div className="mt-10 text-center sm:hidden">
          <Link href="/menu" className="inline-flex items-center justify-center gap-2 text-orange-600 font-medium hover:text-orange-700 border border-orange-200 bg-orange-50 px-6 py-3 rounded-full w-full">
            Lihat Semua Menu &rarr;
          </Link>
        </div>
      </section>

      {/* 4. TENTANG OJOLALI SECTION */}
      <section className="px-4">
        <div className="bg-white border border-stone-100 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 shadow-sm overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-orange-600 font-bold tracking-wider uppercase text-sm mb-4 block">Tentang Ojolali</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight mb-6">Kehangatan dalam Setiap Mangkuk</h2>
              <p className="text-stone-600 text-lg leading-relaxed mb-6">
                Berawal dari resep sederhana keluarga, <strong>UMKM Baso & Mie Ayam Ojolali</strong> hadir untuk memberikan sajian kuliner Nusantara yang berkualitas. 
              </p>
              <p className="text-stone-600 text-lg leading-relaxed">
                Kami selalu menggunakan 100% daging sapi asli untuk baso kami, dan racikan kaldu segar yang direbus berjam-jam untuk menghasilkan rasa gurih alami yang tidak mudah dilupakan ("Ojolali").
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-orange-600 mb-2">10+</span>
                <span className="text-stone-600 font-medium">Tahun Resep Rahasia</span>
              </div>
              <div className="bg-red-50 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-red-600 mb-2">Asli</span>
                <span className="text-stone-600 font-medium">Daging Sapi Pilihan</span>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-amber-600 mb-2">Segar</span>
                <span className="text-stone-600 font-medium">Dibuat Setiap Hari</span>
              </div>
              <div className="bg-orange-100 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-orange-700 mb-2">100%</span>
                <span className="text-stone-600 font-medium">Halal & Higienis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER SECTION */}
      <footer className="bg-stone-900 text-stone-300 rounded-t-[3rem] px-8 py-16 sm:px-12 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
          
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
              UMKM <span className="text-orange-500">Ojolali</span>
            </h3>
            <p className="text-stone-400 mb-8 max-w-sm leading-relaxed">
              Menyajikan baso dan mie ayam otentik dengan resep rahasia keluarga sejak pertama kali Anda mencoba.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors font-bold text-sm">
                IG
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors font-bold text-sm">
                FB
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-lg mb-6">Hubungi Kami</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>MENERIMA PESANAN: <br />0838-2456-5501</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>JL. GN. GALUNGGUNG PERMAI, PERUMNAS,<br />NO. 25 RT. 07 RW. 16 KOTA CIREBON<br />(SAMPING SD. CIREMAI GIRI)</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>TikTok: @BaksoOjoLali</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-lg mb-6">Navigasi</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="hover:text-orange-400 transition-colors">Home</Link></li>
              <li><Link href="/menu" className="hover:text-orange-400 transition-colors">Semua Menu</Link></li>
              <li><Link href="/keranjang" className="hover:text-orange-400 transition-colors">Keranjang</Link></li>
            </ul>
          </div>
          
        </div>
        <div className="border-t border-white/10 mt-16 pt-8 text-center text-sm text-stone-500">
          <p>&copy; {new Date().getFullYear()} UMKM Baso & Mie Ayam Ojolali. All rights reserved.</p>
        </div>
      </footer>
      
    </div>
  )
}
