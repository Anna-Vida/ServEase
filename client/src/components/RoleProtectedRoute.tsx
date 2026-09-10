import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

type RoleProtectedRouteProps = {
  children: ReactNode
  allowedRole: 'admin' | 'staff' | 'customer'
}

function RoleProtectedRoute({
  children,
  allowedRole,
}: RoleProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setAuthenticated(false)
        setLoading(false)
        return
      }

      setAuthenticated(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Failed to load user role:', error)
        setLoading(false)
        return
      }

      setRole(data.role)
      setLoading(false)
    }

    checkUser()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Checking access...
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  if (role !== allowedRole) {
    if (role === 'customer') {
      return <Navigate to="/customer" replace />
    }

    if (role === 'staff') {
      return <Navigate to="/staff" replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}

export default RoleProtectedRoute