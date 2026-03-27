'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, LogOut, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function UserSettings({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('Đang tải...')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        if (data && data.full_name) {
          setFullName(data.full_name)
          setNewName(data.full_name)
        } else {
          setFullName(isAdmin ? 'Quản trị viên' : 'Giáo viên')
        }
      }
    }
    fetchProfile()
  }, [supabase, isAdmin])

  const handleSave = async () => {
    if (!newName.trim() || newName === fullName) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ full_name: newName }).eq('id', user.id)
      setFullName(newName)
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false); }, 1500)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <div className={`flex items-center p-2 cursor-pointer transition-colors ${isAdmin ? 'hover:bg-slate-800 rounded-lg' : 'hover:bg-slate-100 rounded-lg'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isAdmin ? 'bg-slate-800 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isAdmin ? 'text-white' : 'text-slate-900'}`}>{fullName}</div>
              <div className={`text-xs ${isAdmin ? 'text-indigo-400' : 'text-slate-500'}`}>Cài đặt tài khoản</div>
            </div>
          </div>
        }
      />
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cài đặt tài khoản</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium leading-none">Đổi tên hiển thị</h4>
            <div className="flex w-full items-center space-x-2">
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Nhập tên mới..." 
              />
              <Button onClick={handleSave} disabled={loading || newName === fullName || !newName.trim()}>
                {saved ? <Check className="w-4 h-4" /> : 'Lưu'}
              </Button>
            </div>
          </div>
          <div className="border-t pt-4">
            <Button variant="destructive" className="w-full bg-red-500 hover:bg-red-600 outline-none" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Đăng xuất khỏi hệ thống
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
