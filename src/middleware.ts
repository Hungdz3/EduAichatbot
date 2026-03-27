import { createMiddlewareClientResilient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClientResilient(req, res)

  const { data: { session } } = await supabase.auth.getSession()

  // Chưa đăng nhập → về trang login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Lấy role từ bảng profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = profile?.role  // 'admin' | 'teacher'
  const path = req.nextUrl.pathname

  // Giáo viên cố vào /admin → về dashboard
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Admin cố vào /dashboard → về /admin
  if (path.startsWith('/dashboard') && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
