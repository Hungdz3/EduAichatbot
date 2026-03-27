'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Bot, Star } from 'lucide-react'

export default function ChatPage() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [grade, setGrade] = useState('Lớp 1')
  const [subject, setSubject] = useState('Toán')
  const [messageCount, setMessageCount] = useState(0)
  const [showRating, setShowRating] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!input.trim()) return
    const currentCount = messageCount + 1
    setMessageCount(currentCount)
    
    // Kiểm tra để hiện popup đánh giá sau mỗi 15 câu (trong khoảng 10-20)
    if (currentCount > 0 && currentCount % 15 === 0) {
      setShowRating(true)
    }

    const newMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionId, grade, subject })
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId)
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi: ' + (data.error || 'Server error') }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối tới máy chủ.' }])
    }
    
    setLoading(false)
  }

  const handleRatingSubmit = async () => {
    if (ratingValue === 0) return
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('service_evaluations').insert({
      user_id: user?.id,
      rating: ratingValue,
      comment: 'Tự động nhắc sau ' + messageCount + ' câu hỏi.'
    })
    setShowRating(false)
    alert('Cảm ơn bạn đã đánh giá!')
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white w-full relative">
      {showRating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Bạn thấy EduAI thế nào?</h3>
              <p className="text-slate-500">Hãy dành chút thời gian đánh giá trải nghiệm của bạn nhé!</p>
            </div>
            
            <div className="flex justify-center space-x-2 py-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setRatingValue(s)}
                  className={`transition-all ${ratingValue >= s ? 'scale-110' : 'text-slate-300'}`}
                >
                  <Star className={`w-10 h-10 ${ratingValue >= s ? 'text-yellow-400 fill-current' : ''}`} />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRating(false)}>Để sau</Button>
              <Button disabled={ratingValue === 0} className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleRatingSubmit}>Gửi đánh giá</Button>
            </div>
          </Card>
        </div>
      )}

      <header className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-semibold text-lg text-slate-800 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-indigo-500" />
            Trợ Lý AI Soạn Giáo Án
          </h1>
          <p className="text-xs text-slate-500">Mô hình: EduAi 1.0</p>
        </div>
        
        <div className="flex space-x-3">
          <select 
            value={grade} 
            onChange={(e) => setGrade(e.target.value)}
            className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="Lớp 1">Lớp 1</option>
            <option value="Lớp 2">Lớp 2</option>
            <option value="Lớp 3">Lớp 3</option>
            <option value="Lớp 4">Lớp 4</option>
            <option value="Lớp 5">Lớp 5</option>
            <option value="Chung">Chung</option>
          </select>

          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="Toán">Toán</option>
            <option value="Tiếng Việt">Tiếng Việt</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
            <option value="Khoa học Tự nhiên">Khoa học Tự nhiên</option>
            <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
            <option value="Chung">Chung</option>
          </select>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium">Hỏi EduAI bất cứ điều gì về tài liệu giảng dạy</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
            )}
            <Card className={`max-w-[80%] p-4 leading-relaxed ${m.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-md' : 'bg-white text-slate-800 border-slate-200 shadow-sm'}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </Card>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-1">
              <Bot className="w-5 h-5 text-indigo-600" />
            </div>
            <Card className="p-4 bg-white text-slate-500 border-slate-200 shadow-sm italic">
              Đang suy nghĩ...
            </Card>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Nhập yêu cầu từ vựng, bài tập, giáo án..." 
            className="flex-1 h-12 pr-12 focus-visible:ring-indigo-500" 
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon" className="absolute right-1 top-1 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-2">AI có thể tạo ra thông tin không chính xác. Hãy kiểm tra lại kết quả.</p>
      </div>
    </div>
  )
}
