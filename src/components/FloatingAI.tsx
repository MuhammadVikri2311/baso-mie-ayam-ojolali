'use client'

import { useState, useRef, useEffect } from 'react'
import { askAI } from '@/app/ai/actions'
import { ProductCard } from '@/components/ProductCard'
import { Send, Bot, Sparkles, Loader2, User, X, MessageSquare } from 'lucide-react'

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, products?: any[] }[]>([
    {
      role: 'ai',
      content: 'Halo! Saya asisten AI Ojolali. Ada yang bisa saya bantu untuk memilih menu hari ini?'
    }
  ])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickQuestions = [
    '🌶️ Menu Pedas',
    '🍜 Rekomendasi Mie Ayam',
    '🥣 Rekomendasi Baso',
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleAsk = async (text: string) => {
    if (!text.trim()) return
    
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setPrompt('')
    setLoading(true)

    try {
      const response = await askAI(text)
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          content: response?.error || response?.message || 'Maaf, terjadi kesalahan.', 
          products: response?.products 
        }
      ])
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { role: 'ai', content: 'Terjadi kesalahan pada sistem. Silakan coba lagi.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* AI Chat Panel */}
      {isOpen && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl mb-4 w-[90vw] sm:w-[400px] h-[500px] max-h-[70vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Ojolali AI</h3>
                <p className="text-xs text-orange-100">Asisten Rekomendasi Menu</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-grow bg-stone-50 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-white border border-stone-200 text-stone-600 shadow-sm'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white text-stone-800 rounded-tl-none border border-stone-100'}`}>
                    <p>{msg.content}</p>
                  </div>
                  
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {msg.products.map(p => (
                        <div key={p.id} className="text-left scale-95 origin-top-left">
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-600 shadow-sm flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-stone-100 p-3 rounded-2xl rounded-tl-none flex gap-2 items-center shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                  <span className="text-sm text-stone-500">Mengetik...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-stone-200 p-3 flex-shrink-0">
            {/* Quick Questions */}
            <div className="flex flex-wrap gap-2 mb-3">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(q)}
                  disabled={loading}
                  className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-orange-100 transition disabled:opacity-50 border border-orange-100 whitespace-nowrap"
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
              className="flex gap-2"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                placeholder="Ketik pesan..."
                className="flex-grow px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="bg-orange-600 text-white p-2.5 rounded-xl hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-stone-300"
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
        className="group relative bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-orange-500/30"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-stone-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-sm">
            Tanya AI
            <div className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-stone-800"></div>
          </div>
        )}
      </button>
    </div>
  )
}
