'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Search, Copy, Check } from 'lucide-react'

type PromptItem = {
  id: string; 
  title: string; 
  content: string; 
  category: string;
}

export default function TeacherPrompts() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('Tất cả')
  const [selectedSubject, setSelectedSubject] = useState('Tất cả')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('prompts_library')
      .select('*')
    if (data) setItems(data)
    setLoading(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const grades = ['Tất cả', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Chung']
  const subjects = ['Tất cả', 'Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học tự nhiên', 'Lịch sử và Địa lý']
  const categories = ['Tất cả', 'Giáo án', 'Bài tập', 'Tra cứu', 'Kịch bản', 'Khác']

  const filteredItems = items.filter(item => {
    // Parse tags từ mảng JSON [Grade, Subject] hoặc fallback chuỗi cũ
    let itemGrade = 'Chung'
    let itemSubject = 'Phần chung'
    
    if (Array.isArray(item.tags)) {
      [itemGrade, itemSubject] = item.tags
    } else if (typeof item.tags === 'string') {
      [itemGrade, itemSubject] = item.tags.split('|')
    }
    
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    
    const matchesGrade = selectedGrade === 'Tất cả' || itemGrade === selectedGrade
    const matchesSubject = selectedSubject === 'Tất cả' || itemSubject === selectedSubject
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory
    
    return matchesSearch && matchesGrade && matchesSubject && matchesCategory
  })

  // Sắp xếp theo Môn học -> Lớp
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aGrade = 'Chung', aSub = 'Phần chung'
    let bGrade = 'Chung', bSub = 'Phần chung'
    
    if (Array.isArray(a.tags)) [aGrade, aSub] = a.tags
    else if (typeof a.tags === 'string') [aGrade, aSub] = a.tags.split('|')
    
    if (Array.isArray(b.tags)) [bGrade, bSub] = b.tags
    else if (typeof b.tags === 'string') [bGrade, bSub] = b.tags.split('|')

    const subjectOrder = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học tự nhiên', 'Lịch sử và Địa lý', '-']
    const gradeOrder = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Chung']

    const subIndexA = subjectOrder.indexOf(aSub)
    const subIndexB = subjectOrder.indexOf(bSub)
    if (subIndexA !== subIndexB) return subIndexA - subIndexB

    const gradeIndexA = gradeOrder.indexOf(aGrade)
    const gradeIndexB = gradeOrder.indexOf(bGrade)
    return gradeIndexA - gradeIndexB
  })

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 space-y-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col border-b border-slate-200 pb-8 gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-indigo-600" />
              Thư Viện Prompt Mẫu
            </h1>
            <p className="text-slate-500">Tham khảo các mẫu câu lệnh tối ưu để tương tác hiệu quả nhất với EduAI.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm mẫu câu lệnh..." 
              className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">Lớp:</span>
            <select 
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border-none text-slate-700 text-sm rounded-lg focus:ring-indigo-500 block p-2.5 outline-none font-medium"
            >
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">Môn:</span>
            <select 
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border-none text-slate-700 text-sm rounded-lg focus:ring-indigo-500 block p-2.5 outline-none font-medium"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">Loại:</span>
            <select 
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border-none text-slate-700 text-sm rounded-lg focus:ring-indigo-500 block p-2.5 outline-none font-medium"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(selectedGrade !== 'Tất cả' || selectedSubject !== 'Tất cả' || selectedCategory !== 'Tất cả' || search) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {setSelectedGrade('Tất cả'); setSelectedSubject('Tất cả'); setSelectedCategory('Tất cả'); setSearch('')}}
              className="text-indigo-600 hover:bg-indigo-50 font-bold ml-auto"
            >
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Không tìm thấy mẫu câu lệnh nào phù hợp.</p>
          <Button variant="outline" onClick={() => {setSelectedGrade('Tất cả'); setSelectedSubject('Tất cả'); setSelectedCategory('Tất cả'); setSearch('')}}>Hiển thị tất cả</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.map((item) => {
            // Parse tags từ mảng JSON [Grade, Subject] hoặc fallback chuỗi cũ
            let itemGrade = 'Chung'
            let itemSubject = 'Phần chung'
            
            if (Array.isArray(item.tags)) {
              [itemGrade, itemSubject] = item.tags
            } else if (typeof item.tags === 'string') {
              [itemGrade, itemSubject] = item.tags.split('|')
            }
            return (
              <Card key={item.id} className="group bg-white border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col h-full overflow-hidden border">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {itemGrade !== 'Chung' && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 uppercase">
                        {itemGrade}
                      </span>
                    )}
                    {itemSubject !== '-' && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20 uppercase">
                        {itemSubject}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded border border-indigo-500/20 uppercase">
                      {item.category}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4 flex-1 flex flex-col">
                  <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-100/50 flex-1 overflow-hidden">
                    <p className="text-slate-600 text-sm italic leading-relaxed line-clamp-6">
                      "{item.content}"
                    </p>
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-50 to-transparent"></div>
                  </div>
                  
                  <Button 
                    onClick={() => copyToClipboard(item.content, item.id)}
                    className={`w-full h-11 rounded-xl font-bold transition-all ${
                      copiedId === item.id 
                      ? 'bg-green-600 hover:bg-green-600 text-white shadow-green-100' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'
                    } shadow-lg`}
                  >
                    {copiedId === item.id ? (
                      <><Check className="w-4 h-4 mr-2" /> Đã sao chép</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" /> Sao chép Prompt</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
