import { useEffect, useState } from 'react'
import { ChevronLeft, Mail, Phone, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Customer = {
  id: string
  full_name: string
  phone: string | null
  created_at: string
  email?: string | null
}

function AdminCustomers() {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          created_at
        `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load customers:', error)
      } else {
        setCustomers((data as Customer[]) ?? [])
      }

      setLoading(false)
    }

    loadCustomers()
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
          <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
            <UserRound size={24} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              ServEase
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Customers
            </h1>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {loading ? (
            <div className="p-8 text-slate-400">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-slate-400">
              No customers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Phone
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Joined
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                            <UserRound size={18} />
                          </div>

                          <div>
                            <p className="font-medium text-white">
                              {customer.full_name || 'Unnamed customer'}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {customer.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {customer.phone ? (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone size={16} />
                            {customer.phone}
                          </div>
                        ) : (
                          <span className="text-slate-500">
                            No phone
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {new Date(customer.created_at).toLocaleDateString(
                          'en-PH',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
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

export default AdminCustomers