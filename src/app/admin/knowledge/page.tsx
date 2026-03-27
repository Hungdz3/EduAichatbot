'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Database, Plus, Trash2 } from 'lucide-react'

type KBItem = {
  id: string; question: string; answer: string; grade: string; subject: string;
}

export default function KnowledgeBaseAdmin() {
  const [items, setItems] = useState<KBItem[]>([])
  const [totalCount, setTotalCount] = useState(0) // [MỚI] Tổng số lượng thực tế
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [grade, setGrade] = useState('Lớp 1')
  const [subject, setSubject] = useState('Toán')
  
  // Bộ lọc Dữ liệu
  const [filterGrade, setFilterGrade] = useState('Tất cả')
  const [filterSubject, setFilterSubject] = useState('Tất cả')
  
  const supabase = createClient()

  useEffect(() => {
    fetchKB()
  }, [filterGrade, filterSubject])

  const fetchKB = async () => {
    setLoading(true)
    let queryCount = supabase.from('knowledge_base').select('*', { count: 'exact', head: true })
    let queryData = supabase.from('knowledge_base').select('*').limit(100)

    if (filterGrade !== 'Tất cả') {
      queryCount = queryCount.eq('grade', filterGrade)
      queryData = queryData.eq('grade', filterGrade)
    }
    if (filterSubject !== 'Tất cả') {
      queryCount = queryCount.eq('subject', filterSubject)
      queryData = queryData.eq('subject', filterSubject)
    }

    // 1. Lấy tổng số lượng thực tế từ Database (Hàng nghìn dòng) theo bộ lọc
    const { count } = await queryCount
    if (count !== null) setTotalCount(count)

    // 2. Chỉ lấy 100 dòng đầu tiên để hiển thị demo (Tránh làm đơ trình duyệt)
    const { data } = await queryData
    if (data) {
      // Sắp xếp tùy chỉnh: Lớp -> Môn học (Phần chung cuối cùng)
      const sorted = [...data].sort((a, b) => {
        // 1. So sánh Lớp (Grade) - Trích xuất số để so sánh chính xác (Lớp 1 < Lớp 10)
        const getGradeLevel = (g: string) => {
          const m = g.match(/\d+/)
          return m ? parseInt(m[0]) : 999
        }
        
        const gradeA = getGradeLevel(a.grade)
        const gradeB = getGradeLevel(b.grade)
        
        if (gradeA !== gradeB) return gradeA - gradeB
        
        // 2. So sánh Môn học (Subject)
        // Ưu tiên "Phần chung" ở cuối cùng của mỗi lớp
        if (a.subject === 'Phần chung' && b.subject !== 'Phần chung') return 1
        if (a.subject !== 'Phần chung' && b.subject === 'Phần chung') return -1
        
        return a.subject.localeCompare(b.subject, 'vi')
      })
      setItems(sorted)
    }
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question || !answer) return
    const { data: userData } = await supabase.auth.getUser()
    
    await supabase.from('knowledge_base').insert({
      question, answer, grade, subject, created_by: userData.user?.id
    })
    
    setQuestion(''); setAnswer('')
    fetchKB()
  }

  const handleDelete = async (id: string) => {
    if(!confirm('Bạn có chắc muốn xóa?')) return
    await supabase.from('knowledge_base').delete().eq('id', id)
    fetchKB()
  }

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Database className="w-8 h-8 mr-3 text-indigo-400" />
          Quản lý Dữ liệu Hỏi Đáp (Knowledge Base)
        </h1>
        <p className="text-slate-400 mt-2">Thêm các câu hỏi và câu trả lời chuẩn xác để AI ưu tiên sử dụng khi giáo viên hỏi.</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="bg-slate-900/50 border-b border-slate-700">
          <CardTitle className="text-lg text-white">Thêm Dữ liệu mới</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-300">Lớp</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md">
                  {['Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Chung'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-300">Môn học</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md">
                  {['Toán','Tiếng Việt','Tiếng Anh','Khoa học Tự nhiên','Lịch sử & Địa lý', 'Phần chung'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Câu hỏi (Question)</label>
              <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ví dụ: Quy định đánh giá học sinh môn Toán lớp 3 là gì?" required className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Câu trả lời chuẩn xác (Answer)</label>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Nhập câu trả lời cụ thể để AI dựa vào đó tư vấn cho giáo viên..." required className="w-full h-32 p-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none resize-none"></textarea>
            </div>

            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="w-4 h-4 mr-2" /> Thêm vào CSDL</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-6 border-t border-slate-800 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
             <h2 className="text-xl font-bold text-white">Dữ liệu hiện có ({totalCount})</h2>
             {totalCount > 100 && (
               <p className="text-xs text-slate-500 italic">* Đang hiển thị tối đa 100 mục (hãy chọn bộ lọc để xem chi tiết hơn)</p>
             )}
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
             <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="h-10 flex-1 md:w-32 px-3 bg-slate-800 border border-slate-700 text-white rounded-md text-sm outline-none focus:border-indigo-500">
                {['Tất cả', 'Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5','Chung'].map(g => <option key={g} value={g}>{g === 'Tất cả' ? 'Tất cả lớp' : g}</option>)}
             </select>
             <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="h-10 flex-1 md:w-40 px-3 bg-slate-800 border border-slate-700 text-white rounded-md text-sm outline-none focus:border-indigo-500">
                {['Tất cả', 'Toán','Tiếng Việt','Tiếng Anh','Khoa học Tự nhiên','Lịch sử & Địa lý', 'Phần chung'].map(s => <option key={s} value={s}>{s === 'Tất cả' ? 'Tất cả môn' : s}</option>)}
             </select>
          </div>
        </div>
        
        {loading ? <p className="text-slate-400">Đang tải dữ liệu...</p> : items.length === 0 ? <p className="text-slate-500">Không có dữ liệu nào phù hợp với bộ lọc.</p> : (
          <div className="grid gap-4">
            {items.map(item => (
              <Card key={item.id} className="relative overflow-hidden bg-slate-800 border-slate-700">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <CardContent className="p-5 flex justify-between items-start">
                  <div className="space-y-2 flex-1 pr-6">
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded-md font-medium">{item.grade}</span>
                      <span className="px-2 py-1 bg-green-500/10 text-green-300 text-xs rounded-md font-medium">{item.subject}</span>
                    </div>
                    <h3 className="font-bold text-slate-200 text-lg">Hỏi: {item.question}</h3>
                    <p className="text-slate-400 bg-slate-900/50 p-3 rounded-md border border-slate-700/50 whitespace-pre-wrap">Đáp: {item.answer}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
