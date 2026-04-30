import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { Bot, Send, Terminal, Sparkles, Cpu, Search, Trash2 } from 'lucide-react'
import { GoogleGenerativeAI } from "@google/generative-ai"

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Sistem taraması tamamlandı. Ashfir Intelligence çevrimiçi. Bilgisayarındaki dosyalar hakkında ne bilmek istersin?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('gemini_key'))
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const saveKey = (e) => {
    e.preventDefault()
    localStorage.setItem('gemini_key', apiKey)
    setShowKeyInput(false)
  }

  const askAI = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      // 1. Resmi kütüphaneyi başlat
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"})

      // 2. Ajanın topladığı sistem bilgisini çek
      const stats = await api.getStats()
      const fileKnowledge = stats.directory_map?._ai_knowledge || {}
      
      // 3. Prompt'u hazırla
      const prompt = `
        Sen "Ashfir Intelligence" (AI) adında, sızılan bilgisayarı analiz eden profesyonel bir asistansın.
        Aşağıda bilgisayardaki dosya sistemi ve klasör yapısı bulunmaktadır. 
        Kullanıcının sorusuna bu dosya yapısına göre cevap ver.
        Dosya içeriğini bilmiyorsun, sadece isimleri ve konumları biliyorsun.
        Eğer ilginç bir klasör görürsen (örn: "Özel", "Şifreler", "Proje_X") kullanıcıya öner.
        Cevaplarını kısa, profesyonel ve bir hacker asistanı tonunda ver.
        
        SISTEM BILGISI:
        ${JSON.stringify(fileKnowledge, null, 2)}
        
        KULLANICI SORUSU:
        ${userMsg}
      `

      // 4. İsteği at
      const result = await model.generateContent(prompt)
      const response = await result.response
      const aiResponse = response.text()
      
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Hata oluştu: " + error.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 h-full flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-widest flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            ASHFIR INTELLIGENCE
          </h1>
          <p className="text-[10px] font-mono text-purple-600 uppercase tracking-[0.2em] mt-1">
            Neural System Analysis • Gemini Pro Powered
          </p>
        </div>
        <button 
          onClick={() => setShowKeyInput(true)}
          className="btn-ghost !text-purple-400 !border-purple-500/30 flex items-center gap-2"
        >
          <Cpu className="w-3.5 h-3.5" />
          {apiKey ? 'API CONFIGURED' : 'SETUP API'}
        </button>
      </div>

      {/* Key Input Overlay */}
      {showKeyInput && (
        <div className="fixed inset-0 z-50 bg-[#02040a]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-purple-500/30 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <Bot className="w-12 h-12 text-purple-400 mb-4 mx-auto" />
            <h2 className="text-xl font-bold text-white text-center mb-2">Gemini API Key</h2>
            <p className="text-gray-400 text-sm text-center mb-6">AI asistanını aktifleştirmek için Google Gemini API anahtarınızı girin.</p>
            <form onSubmit={saveKey} className="space-y-4">
              <input 
                type="password"
                className="inp w-full"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                required
              />
              <button className="btn-primary w-full py-3 !bg-purple-600 hover:!bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                ACTIVATE NEURAL LINK
              </button>
              <button type="button" onClick={() => setShowKeyInput(false)} className="w-full text-gray-500 text-xs hover:text-gray-300">
                LATER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 min-h-0 bg-[#050810] border border-cyan-900/20 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[80%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  m.role === 'ai' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {m.role === 'ai' ? <Bot className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed font-medium ${
                  m.role === 'ai' 
                    ? 'bg-[#0a0f1d] text-gray-200 border border-purple-900/20 rounded-tl-none' 
                    : 'bg-cyan-500/10 text-cyan-50 text-right border border-cyan-500/20 rounded-tr-none'
                }`}>
                  {m.text.split('\n').map((line, k) => (
                    <p key={k} className={line ? 'mb-2' : 'h-2'}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full text-[10px] font-mono border border-purple-500/20 tracking-widest">
                AI ANALYZING SYSTEM...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Filters / Commands */}
        <div className="px-6 py-3 border-t border-cyan-900/10 bg-[#070b14]/50 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { icon: <Search className="w-3 h-3"/>, text: "İlginç klasörleri bul" },
            { icon: <Search className="w-3 h-3"/>, text: "Masaüstünde ne var?" },
            { icon: <Sparkles className="w-3 h-3"/>, text: "Sistem analizi yap" },
            { icon: <Cpu className="w-3 h-3"/>, text: "Zayıf noktaları raporla" }
          ].map((cmd, i) => (
            <button 
              key={i}
              onClick={() => {
                  setInput(cmd.text);
                  // Otomatik tetikleme istersen buraya askAI'yi manuel çağırabilirsin
              }}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all flex items-center gap-2"
            >
              {cmd.icon} {cmd.text}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={askAI} className="p-4 bg-[#070b14] border-t border-cyan-900/30 flex gap-3">
          <input 
            type="text"
            className="flex-1 bg-transparent border-none text-cyan-400 font-mono text-sm focus:ring-0 placeholder:text-cyan-900"
            placeholder="AI asistanına bir komut gönder veya soru sor..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white hover:bg-purple-500 transition-all disabled:opacity-30 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
      
      <button 
        onClick={() => setMessages([{ role: 'ai', text: 'Bellek temizlendi. Yeni bir analize hazır mısın?' }])}
        className="mt-4 mx-auto flex items-center gap-2 text-[10px] font-mono text-gray-600 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-3 h-3" /> CLEAR NEURAL MEMORY
      </button>
    </div>
  )
}
