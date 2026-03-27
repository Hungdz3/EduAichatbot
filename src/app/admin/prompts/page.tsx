'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BookOpen, Plus, Trash2, Search } from 'lucide-react'

type PromptItem = {
  id: string; title: string; content: string; category: string;
}

export default function PromptsAdmin() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Giáo án')
  const [grade, setGrade] = useState('Lớp 1')
  const [subject, setSubject] = useState('Toán')
  
  // States cho bộ lọc danh sách
  const [filterSearch, setFilterSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('Tất cả')
  const [filterSubject, setFilterSubject] = useState('Tất cả')
  const [filterCategory, setFilterCategory] = useState('Tất cả')

  const supabase = createClient()

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prompts_library')
        .select('*')
      
      if (error) throw error
      if (data) setItems(data)
    } catch (err: any) {
      console.error('Error fetching prompts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Lưu Grade và Subject vào cột tags dưới dạng mảng JSON [Grade, Subject]
      const tags = [grade, subject]

      const { error } = await supabase.from('prompts_library').insert({
        title, 
        content, 
        category, 
        tags,
        created_by: user.id
      })

      if (error) throw error
      
      setTitle('')
      setContent('')
      fetchPrompts()
    } catch (err: any) {
      alert('Lỗi khi thêm prompt: ' + err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if(!confirm('Bạn có chắc muốn xóa Prompt mẫu này?')) return
    try {
      const { error } = await supabase.from('prompts_library').delete().eq('id', id)
      if (error) throw error
      fetchPrompts()
    } catch (err: any) {
      alert('Lỗi khi xóa: ' + err.message)
    }
  }

  // Logic lọc và sắp xếp
  const filteredItems = items.filter(item => {
    let itemGrade = 'Chung'
    let itemSubject = 'Phần chung'
    
    if (Array.isArray(item.tags)) {
      [itemGrade, itemSubject] = item.tags
    } else if (typeof item.tags === 'string') {
      [itemGrade, itemSubject] = item.tags.split('|')
    }
    
    const matchesSearch = 
      item.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
      item.content.toLowerCase().includes(filterSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(filterSearch.toLowerCase())
    
    const matchesGrade = filterGrade === 'Tất cả' || itemGrade === filterGrade
    const matchesSubject = filterSubject === 'Tất cả' || itemSubject === filterSubject
    const matchesCategory = filterCategory === 'Tất cả' || item.category === filterCategory
    
    return matchesSearch && matchesGrade && matchesSubject && matchesCategory
  })

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
    <div className="space-y-8 p-8 max-w-6xl mx-auto text-slate-200">
      <div className="border-b border-slate-700 pb-6">
        <h1 className="text-3xl font-bold flex items-center text-white">
          <BookOpen className="w-8 h-8 mr-3 text-indigo-400" />
          Quản Lý Thư Viện Prompt
        </h1>
        <p className="text-slate-400 mt-2">Cung cấp các mẫu câu hỏi chất lượng cao để hỗ trợ giáo viên soạn thảo tốt hơn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card className="bg-slate-800 border-slate-700 sticky top-8 shadow-xl">
            <CardHeader className="bg-slate-900/50 border-b border-slate-700">
              <CardTitle className="text-lg text-white">Thêm Prompt Mới</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tiêu đề</label>
                  <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Ví dụ: Soạn giáo án Toán lớp 3..." 
                    required 
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Lớp</label>
                    <select 
                      value={grade} 
                      onChange={e => setGrade(e.target.value)} 
                      className="w-full h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md outline-none"
                    >
                      {['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Chung'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Môn học</label>
                    <select 
                      value={subject} 
                      onChange={e => setSubject(e.target.value)} 
                      className="w-full h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md outline-none"
                    >
                      {['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học tự nhiên', 'Lịch sử và Địa lý'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Thể loại</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md outline-none"
                  >
                    {['Giáo án','Bài tập','Tra cứu', 'Kịch bản', 'Khác'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nội dung (Prompt)</label>
                  <textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="Nhập nội dung câu lệnh chi tiết..." 
                    required 
                    className="w-full h-40 p-3 bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-md outline-none resize-none"
                  ></textarea>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 shadow-indigo-900/20 shadow-lg">
                  <Plus className="w-5 h-5 mr-2" /> Lưu Prompt
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                placeholder="Tìm kiến trong danh sách..."
                className="pl-10 bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">Lớp:</span>
              <select 
                value={filterGrade} 
                onChange={e => setFilterGrade(e.target.value)}
                className="h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md outline-none text-sm"
              >
                {['Tất cả', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Chung'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">Môn:</span>
              <select 
                value={filterSubject} 
                onChange={e => setFilterSubject(e.target.value)}
                className="h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md outline-none text-sm"
              >
                {['Tất cả', 'Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học tự nhiên', 'Lịch sử và Địa lý'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">Loại:</span>
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                className="h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md outline-none text-sm"
              >
                {['Tất cả', 'Giáo án','Bài tập','Tra cứu', 'Kịch bản', 'Khác'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {(filterSearch || filterGrade !== 'Tất cả' || filterSubject !== 'Tất cả' || filterCategory !== 'Tất cả') && (
              <Button variant="ghost" size="sm" onClick={() => {setFilterSearch(''); setFilterGrade('Tất cả'); setFilterSubject('Tất cả'); setFilterCategory('Tất cả')}} className="text-indigo-400 hover:text-indigo-300 font-bold">
                Xóa lọc
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Danh sách Prompt ({sortedItems.length})</h2>
            <Button variant="ghost" size="sm" onClick={fetchPrompts} className="text-slate-400 hover:text-white">
              Làm mới
            </Button>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-800/50 animate-pulse rounded-lg border border-slate-700"></div>
              ))}
            </div>
          ) : sortedItems.length === 0 ? (
            <Card className="bg-slate-800/30 border-dashed border-slate-700 py-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">Không có dữ liệu phù hợp với bộ lọc.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedItems.map(item => {
                // Parse tags từ mảng JSON [Grade, Subject] hoặc fallback chuỗi cũ
                let itemGrade = 'Chung'
                let itemSubject = 'Phần chung'
                
                if (Array.isArray(item.tags)) {
                  [itemGrade, itemSubject] = item.tags
                } else if (typeof item.tags === 'string') {
                  [itemGrade, itemSubject] = item.tags.split('|')
                }
                return (
                  <Card key={item.id} className="group overflow-hidden bg-slate-800 border-slate-700 hover:border-indigo-500/50 transition-all shadow-lg">
                    <CardContent className="p-0">
                      <div className="flex text-slate-200">
                        <div className="w-1.5 bg-indigo-500"></div>
                        <div className="p-5 flex-1 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
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
                              <h3 className="font-bold text-white text-lg">{item.title}</h3>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-slate-400 text-sm bg-slate-900/80 p-4 rounded-lg border border-slate-700/30 font-mono italic leading-relaxed">
                            "{item.content}"
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
