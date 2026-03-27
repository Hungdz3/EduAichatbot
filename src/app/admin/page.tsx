'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  MessageSquare, 
  Star, 
  Lightbulb, 
  RefreshCw,
  TrendingUp,
  Clock
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DashboardStats {
  teacherCount: number
  sessionCount: number
}

interface Evaluation {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: { full_name: string } | null
}

interface FeatureRequest {
  id: string
  content: string
  status: string
  created_at: string
  profiles: { full_name: string } | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ teacherCount: 0, sessionCount: 0 })
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // 1. Đếm số lượng giáo viên (loại trừ admin)
    const { count: teachers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher')

    // 2. Đếm số lượng phiên chat
    const { count: sessions } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })

    setStats({ 
      teacherCount: teachers || 0, 
      sessionCount: sessions || 0 
    })

    // 3. Lấy 5 đánh giá mới nhất
    const { data: evals } = await supabase
      .from('service_evaluations')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5)
    
    setEvaluations((evals as any) || [])

    // 4. Lấy 5 yêu cầu mới nhất
    const { data: reqs } = await supabase
      .from('feature_requests')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5)

    setRequests((reqs as any) || [])

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white border-b border-slate-800 pb-4 w-full">
          Tổng Quan Quản Trị Hệ Thống
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-400 hover:text-white"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700 shadow-xl border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" /> Tổng số Giáo viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-white">{stats.teacherCount}</div>
            <p className="text-xs text-slate-500 mt-2">Tài khoản vai trò Teacher hiện có</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 shadow-xl border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-sm font-medium flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" /> Phiên chat đã thực hiện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-white">{stats.sessionCount}</div>
            <p className="text-xs text-slate-500 mt-2">Tổng số hội thoại đã tạo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bảng Đánh giá dịch vụ */}
        <Card className="bg-slate-800 border-slate-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" /> Đánh giá dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Người dùng</TableHead>
                  <TableHead className="text-slate-400">Đánh giá</TableHead>
                  <TableHead className="text-slate-400 px-4">Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">Đang tải...</TableCell></TableRow>
                ) : evaluations.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">Chưa có đánh giá nào.</TableCell></TableRow>
                ) : (
                  evaluations.map((ev) => (
                    <TableRow key={ev.id} className="border-slate-700">
                      <TableCell className="font-medium text-slate-300">{ev.profiles?.full_name || 'Ẩn danh'}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-yellow-500">
                          {Array.from({ length: ev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px] mt-1">{ev.comment}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap px-4">
                        {new Date(ev.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bảng Yêu cầu bổ sung */}
        <Card className="bg-slate-800 border-slate-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-blue-500" /> Yêu cầu bổ sung tính năng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Nội dung yêu cầu</TableHead>
                  <TableHead className="text-slate-400">Trạng thái</TableHead>
                  <TableHead className="text-slate-400 px-4">Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">Đang tải...</TableCell></TableRow>
                ) : requests.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">Chưa có yêu cầu nào.</TableCell></TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} className="border-slate-700">
                      <TableCell>
                        <div className="text-sm text-slate-300 line-clamp-1">{req.content}</div>
                        <div className="text-[10px] text-slate-500 mt-1">Gửi bởi: {req.profiles?.full_name || 'Ẩn danh'}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          req.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap px-4">
                        {new Date(req.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Button({ className, variant, size, ...props }: any) {
  return <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 ${className}`} {...props} />
}
