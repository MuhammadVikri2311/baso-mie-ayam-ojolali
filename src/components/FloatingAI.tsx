'use client'

import { useState, useRef, useEffect } from 'react'
import { askAI, UserRoleType } from '@/app/ai/actions'
import { ProductCard } from '@/components/ProductCard'
import { Send, Bot, Sparkles, User, X, RotateCcw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface AIProduct {
  id: string
  name: string
  price: number
  image: string | null
  description?: string | null
  isAvailable: boolean
  category: { name: string }
}

/**
 * Normalisasi teks balasan AI untuk menghilangkan \n mentah,
 * merapikan jarak antarparagraf, dan memastikan format list/bullet terbaca dengan benar.
 */
function sanitizeAIMessage(content: string): string {
  if (!content) return ''
  let text = content
    // Normalisasi karakter newline escape (\r\n, \n, \\n, dll)
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Ubah simbol bullet unicode menjadi format markdown dash list
    .replace(/^[ \t]*[•●]\s+/gm, '- ')
    // Pastikan item list bernomor atau bullet yang diawali kalimat memiliki baris tersendiri
    .replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n$2')
    .replace(/([^\n])\s+([•●\-]\s+)/g, '$1\n- ')
    // Pastikan baris sebelum bullet memiliki blank line agar parser markdown mendeteksi list terpisah
    .replace(/([^\n])\n(?=[•●\-])/g, '$1\n\n')
    // Batasi baris kosong berlebihan maksimal 2 untuk kerapian jarak antarparagraf
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Pertahankan baris baru tunggal agar tidak digabung secara paksa oleh parser markdown
  text = text.replace(/([^\n])\n(?!\n|[0-9]+\.|\-|\*|#)/g, '$1  \n')
  return text
}

// Komponen kustom untuk rendering Markdown yang elegan, rapi, dan konsisten
const markdownComponents = {
  h1: ({ children }: any) => (
    <h3 className="text-[15px] sm:text-base font-bold text-stone-900 mt-3 mb-1.5 flex items-center gap-2 tracking-tight">
      <span className="w-1.5 h-4 bg-orange-500 rounded-full inline-block flex-shrink-0" />
      <span>{children}</span>
    </h3>
  ),
  h2: ({ children }: any) => (
    <h4 className="text-[14px] sm:text-[14.5px] font-bold text-stone-900 mt-2.5 mb-1.5 flex items-center gap-2 tracking-tight">
      <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block flex-shrink-0" />
      <span>{children}</span>
    </h4>
  ),
  h3: ({ children }: any) => (
    <h5 className="text-[13.5px] sm:text-[14px] font-bold text-stone-900 mt-2.5 mb-1 flex items-center gap-1.5 tracking-tight">
      <span className="w-1.5 h-3 bg-orange-500 rounded-full inline-block flex-shrink-0" />
      <span>{children}</span>
    </h5>
  ),
  h4: ({ children }: any) => (
    <h6 className="text-xs font-bold text-stone-800 uppercase tracking-wider mt-2 mb-1">
      {children}
    </h6>
  ),
  p: ({ children }: any) => (
    <p className="text-[13.5px] sm:text-sm text-stone-700 leading-[1.68] my-2 first:mt-0 last:mb-0 break-words font-normal">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="my-2 space-y-1.5 pl-4 list-disc marker:text-orange-500 text-[13.5px] sm:text-sm text-stone-700 leading-[1.68]">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-2 space-y-2 pl-4 list-decimal marker:text-orange-600 marker:font-bold text-[13.5px] sm:text-sm text-stone-700 leading-[1.68]">
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-[13.5px] sm:text-sm text-stone-700 leading-[1.68] pl-0.5 break-words" {...props}>
      {children}
    </li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-stone-900">
      {children}
    </strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-stone-600">
      {children}
    </em>
  ),
  code: ({ children }: any) => (
    <code className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-800 font-mono text-[12px] border border-orange-200/60 inline-block my-0.5">
      {children}
    </code>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-orange-500 pl-3 py-1.5 my-2.5 text-stone-600 bg-orange-50/50 rounded-r-lg text-[13px] italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-orange-600 hover:text-orange-700 underline font-medium"
    >
      {children}
    </a>
  ),
}

export default function FloatingAI() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Deteksi portal dan role aktif pengguna
  const isKasirPortal = Boolean(pathname?.startsWith('/kasir'))
  const isAdminPortal = Boolean(pathname?.startsWith('/admin'))
  const portalContext: 'admin' | 'kasir' | 'pelanggan' = isAdminPortal
    ? 'admin'
    : isKasirPortal
    ? 'kasir'
    : 'pelanggan'

  const currentRole = (session?.user?.role || 'GUEST').toUpperCase()
  const isKasir = isKasirPortal && (currentRole === 'KASIR' || currentRole === 'ADMIN')
  const isAdmin = isAdminPortal && currentRole === 'ADMIN'
  const isCustomer = !isAdminPortal && !isKasirPortal && currentRole === 'PELANGGAN'

  const activeRoleMode: UserRoleType = isAdmin
    ? 'ADMIN'
    : isKasir
    ? 'KASIR'
    : isCustomer
    ? 'PELANGGAN'
    : 'GUEST'

  const isModeAdmin = activeRoleMode === 'ADMIN'
  const isModeKasir = activeRoleMode === 'KASIR'
  const isModePelanggan = activeRoleMode === 'PELANGGAN' || activeRoleMode === 'GUEST'

  // Pesan sambutan awal sesuai role aktif
  const initialGreeting = isModeKasir
    ? 'Halo Kasir! Saya adalah asisten AI kasir Ojolali. Ada yang perlu dicek terkait antrean pesanan, omzet operasional, atau riwayat transaksi kasir?'
    : isModeAdmin
    ? 'Halo Administrator! Saya adalah asisten AI admin Ojolali. Ada yang perlu dianalisis terkait pengelolaan menu, data pesanan, laporan, atau statistik performa toko?'
    : 'Halo! Saya adalah asisten AI resmi Baso & Mie Ayam Ojolali. Ada yang bisa saya bantu terkait pilihan menu, harga, jam operasional, atau rekomendasi hidangan lezat hari ini?'

  const [messages, setMessages] = useState<{
    role: 'user' | 'ai'
    content: string
    products?: AIProduct[]
  }[]>([
    {
      role: 'ai',
      content: initialGreeting,
    },
  ])

  // Reset riwayat percakapan ketika akun, role, atau portal berubah
  const sessionIdentityKey = `${portalContext}_${session?.user?.id || 'guest'}_${session?.user?.role || 'guest'}`
  const lastIdentityKeyRef = useRef<string>(sessionIdentityKey)

  const handleResetChat = () => {
    const greeting = isModeKasir
      ? 'Halo Kasir! Saya adalah asisten AI kasir Ojolali. Ada yang perlu dicek terkait antrean pesanan, omzet operasional, atau riwayat transaksi kasir?'
      : isModeAdmin
      ? 'Halo Administrator! Saya adalah asisten AI admin Ojolali. Ada yang perlu dianalisis terkait pengelolaan menu, data pesanan, laporan, atau statistik performa toko?'
      : 'Halo! Saya adalah asisten AI resmi Baso & Mie Ayam Ojolali. Ada yang bisa saya bantu terkait pilihan menu, harga, jam operasional, atau rekomendasi hidangan lezat hari ini?'
    setMessages([{ role: 'ai', content: greeting }])
  }

  useEffect(() => {
    if (lastIdentityKeyRef.current !== sessionIdentityKey) {
      lastIdentityKeyRef.current = sessionIdentityKey
      handleResetChat()
    }
  }, [sessionIdentityKey, isModeKasir, isModeAdmin])

  // Tombol pertanyaan cepat adaptif sesuai role aktif
  const quickQuestions = isModeKasir
    ? [
        '❓ Apa yang bisa kamu bantu?',
        '👤 Siapa saya?',
        '📊 Total Transaksi Selesai',
        '💰 Total Omzet Riwayat',
        '⏳ Pesanan Menunggu',
        '📅 Transaksi 31 Oktober',
      ]
    : isModeAdmin
    ? [
        '❓ Apa yang bisa kamu bantu?',
        '👤 Siapa saya?',
        '👥 Total Pelanggan',
        '📦 Total Pesanan',
        '💰 Total Pendapatan Toko',
        '🍜 Menu Paling Laris',
      ]
    : [
        '❓ Apa yang bisa kamu bantu?',
        '👤 Siapa saya?',
        '🌶️ Menu Pedas',
        '🍜 Rekomendasi Mie Ayam',
        '🥣 Rekomendasi Baso',
      ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, loading])

  const handleAsk = async (text: string) => {
    if (!text.trim()) return

    // Ambil riwayat percakapan terkini sebelum pesan baru ditambahkan
    const currentHistory = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setPrompt('')
    setLoading(true)

    try {
      // Kirim portalContext ke server action untuk verifikasi sesi terisolasi per portal,
      // riwayat percakapan sebelumnya, serta halaman aktif (pathname)
      const response = await askAI(text, portalContext, undefined, currentHistory, pathname || undefined)
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content:
            response?.error ||
            response?.message ||
            'Maaf, terjadi kesalahan saat memproses respon.',
          products: response?.products,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Terjadi kendala pada sistem. Silakan coba kembali.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end font-sans">
      {/* AI Chat Panel */}
      {isOpen && (
        <div className="bg-white border border-stone-200/80 rounded-2xl sm:rounded-3xl shadow-2xl shadow-orange-950/15 mb-3 sm:mb-4 w-[94vw] sm:w-[450px] h-[580px] sm:h-[620px] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-3.5 sm:p-4 text-white flex flex-col gap-2 flex-shrink-0 shadow-sm relative select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 sm:p-2.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[15px] sm:text-base leading-tight tracking-tight">Ojolali AI</h3>
                    {/* Badge Mode Aktif */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white uppercase tracking-wider backdrop-blur-xs border border-white/30">
                      {isModeAdmin
                        ? '🛡️ Admin'
                        : isModeKasir
                        ? '💼 Kasir'
                        : isCustomer
                        ? '👤 Pelanggan'
                        : '🍜 Tamu'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[11px] sm:text-xs text-orange-100 font-medium line-clamp-1">
                      {isModeAdmin
                        ? 'Asisten Administrasi & Rekap Toko'
                        : isModeKasir
                        ? 'Asisten Kasir & Operasional Antrean'
                        : isCustomer
                        ? 'Asisten Menu & Rekomendasi Kuliner'
                        : 'Asisten Informasi Menu Ojolali'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  className="p-1.5 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors text-white/90 hover:text-white cursor-pointer"
                  title="Mulai Ulang Percakapan"
                  aria-label="Mulai Ulang Percakapan"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors text-white/90 hover:text-white cursor-pointer"
                  title="Tutup Chat"
                  aria-label="Tutup Chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-grow bg-stone-50/70 overflow-y-auto p-3.5 sm:p-4 space-y-4 chat-scrollbar">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={index}
                  className={`flex gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs ${
                      isUser
                        ? 'bg-orange-100 text-orange-600 border border-orange-200/60'
                        : 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/20'
                    }`}
                  >
                    {isUser ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Bubble Container */}
                  <div
                    className={`max-w-[85%] sm:max-w-[84%] ${
                      isUser ? 'items-end' : 'items-start'
                    } flex flex-col`}
                  >
                    {/* Sender Label */}
                    <span className="text-[11px] font-medium text-stone-400 mb-1 px-1">
                      {isUser ? 'Anda' : 'Ojolali AI'}
                    </span>

                    {/* Bubble */}
                    <div
                      className={`rounded-2xl shadow-sm break-words ${
                        isUser
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-xs px-4 py-2.5 sm:px-4.5 sm:py-3 shadow-orange-600/15'
                          : 'bg-white text-stone-800 rounded-tl-xs px-4 py-3 sm:px-4.5 sm:py-3.5 border border-stone-200/80 shadow-stone-200/40'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-[13.5px] sm:text-sm text-white leading-relaxed whitespace-pre-wrap font-normal">
                          {msg.content}
                        </p>
                      ) : (
                        <div className="font-normal">
                          <ReactMarkdown components={markdownComponents}>
                            {sanitizeAIMessage(msg.content)}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Product Cards Recommendations */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 w-full">
                        <div className="flex items-center gap-1.5 mb-2 px-1">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                            Rekomendasi Menu Ojolali
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 w-full">
                          {msg.products.map((p) => (
                            <div key={p.id} className="text-left w-full overflow-hidden rounded-2xl">
                              <ProductCard product={p} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex gap-2.5 sm:gap-3 items-end">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-stone-200/80 px-4 py-3 rounded-2xl rounded-tl-xs shadow-sm flex items-center gap-2.5">
                  <span className="text-xs text-stone-500 font-medium">
                    Ojolali AI sedang mengetik
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-stone-200/80 p-3 sm:p-3.5 flex-shrink-0 rounded-b-2xl sm:rounded-b-3xl">
            {/* Quick Questions */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2 scrollbar-none px-0.5">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(q)}
                  disabled={loading}
                  className="bg-orange-50/90 hover:bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1.5 rounded-full border border-orange-200/70 hover:border-orange-300 transition-all duration-200 shadow-2xs whitespace-nowrap active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAsk(prompt)
              }}
              className="flex gap-2 items-center"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                maxLength={500}
                placeholder={
                  isModeKasir
                    ? 'Tanya antrean, transaksi, menu kasir...'
                    : isModeAdmin
                    ? 'Tanya statistik toko, rekap pesanan, menu...'
                    : 'Tanya rekomendasi menu, harga, pesanan...'
                }
                className="flex-grow px-4 py-2.5 bg-stone-50/90 border border-stone-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-[13.5px] sm:text-sm text-stone-800 placeholder-stone-400 font-sans disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white p-2.5 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-600/20 active:scale-95 flex-shrink-0 flex items-center justify-center cursor-pointer"
                aria-label="Kirim Pesan"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white p-3.5 sm:p-4 rounded-full shadow-xl hover:shadow-2xl shadow-orange-600/30 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-orange-500/30 cursor-pointer"
        aria-label="Buka Chatbot Ojolali"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}

        {/* Pulsing Dot when closed */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white"></span>
          </span>
        )}

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg border border-stone-800">
            {isKasir
              ? 'Tanya AI Kasir'
              : isAdmin
              ? 'Tanya AI Admin'
              : 'Tanya Ojolali AI'}
            <div className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-stone-900"></div>
          </div>
        )}
      </button>
    </div>
  )
}

