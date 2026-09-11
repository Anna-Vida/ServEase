import { useEffect, useState } from 'react'
import { ChevronLeft, UserRoundCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type StaffMember = {
  id: string
  position: string | null
  bio: string | null
  is_active: boolean
  profile: {
    full_name: string
    phone: string | null
  } | null
}

function AdminStaff() {
  const navigate = useNavigate()

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStaff = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('staff_profiles')
        .select(`
          id,
          position,
          bio,
          is_active,
          profile:profiles (
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load staff:', error)
      } else {
        setStaff((data as unknown as StaffMember[]) ?? [])
      }

      setLoading(false)
    }

    loadStaff()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ChevronLeft size={18} />
          Back to dashboard
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-300">
            <UserRoundCheck size={24} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              ServEase
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Staff
            </h1>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {loading ? (
            <div className="p-8 text-slate-400">
              Loading staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-slate-400">
              No staff members found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Staff Member
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Position
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Phone
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {staff.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                            <UserRoundCheck size={18} />
                          </div>

                          <div>
                            <p className="font-medium text-white">
                              {member.profile?.full_name ?? 'Unnamed staff'}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {member.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {member.position || 'No position'}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {member.profile?.phone || 'No phone'}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            member.is_active
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default AdminStaff