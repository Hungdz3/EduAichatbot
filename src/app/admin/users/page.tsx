'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Search, 
  Shield, 
  User as UserIcon, 
  Lock, 
  Unlock, 
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'teacher'
  is_active: boolean
  created_at: string
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const toggleStatus = async (user: UserProfile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)
    
    if (!error) {
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    }
  }

  const toggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'teacher' : 'admin'
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)
    
    if (!error) {
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return
    setIsResetting(true)
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, newPassword })
      })
      const data = await res.json()
      if (data.success) {
        alert('Đã đổi mật khẩu thành công cho ' + (selectedUser.full_name || selectedUser.email))
        setIsResetPasswordOpen(false)
        setNewPassword('')
        setShowNewPassword(false)
      } else {
        alert('Lỗi: ' + data.error)
      }
    } catch (err) {
      alert('Đã xảy ra lỗi khi kết nối API')
    }
    setIsResetting(false)
  }

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center">
          <Users className="w-8 h-8 mr-3 text-blue-500" />
          Quản Lý Giáo Viên
        </h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input 
            placeholder="Tìm kiếm theo tên hoặc email..." 
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900/50">
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400 font-medium">Người dùng</TableHead>
                <TableHead className="text-slate-400 font-medium">Vai trò</TableHead>
                <TableHead className="text-slate-400 font-medium">Trạng thái</TableHead>
                <TableHead className="text-slate-400 font-medium">Ngày tham gia</TableHead>
                <TableHead className="text-right text-slate-400 font-medium px-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Không tìm thấy giáo viên nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-800/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center mr-3 text-slate-300">
                          {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.full_name || 'Hưa cập nhật'}</div>
                          <div className="text-xs text-slate-500">{user.email || 'Chưa có email'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Giáo viên'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {user.is_active ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-1.5" />
                            <span className="text-xs text-green-500">Đang hoạt động</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-slate-500 mr-1.5" />
                            <span className="text-xs text-slate-500">Đã khóa</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                          title="Đổi mật khẩu"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsResetPasswordOpen(true)
                          }}
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-8 w-8 ${user.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'} hover:bg-slate-700`}
                          title={user.is_active ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                          onClick={() => toggleStatus(user)}
                        >
                          {user.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700"
                          title="Thay đổi vai trò"
                          onClick={() => toggleRole(user)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Đặt lại mật khẩu */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription className="text-slate-400">
              Nhập mật khẩu mới cho tài khoản <span className="text-blue-400 font-semibold">{selectedUser?.full_name || selectedUser?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 relative">
            <Input 
              type={showNewPassword ? "text" : "password"}
              placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" 
              className="bg-slate-800 border-slate-700 text-white pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsResetPasswordOpen(false)} className="text-slate-300">
              Hủy
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={isResetting || newPassword.length < 6}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isResetting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận đổi mật khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
