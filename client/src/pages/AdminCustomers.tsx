import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  Search,
  Sparkles,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Customer = {
  id: string
  full_name: string
  phone: string | null
  created_at: string
}

type NavItem = {
  label: string
  path: string
  icon: React.ElementType
}

function AdminCustomers() {
  const navigate = useNavigate()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Bookings',
      path: '/admin/bookings',
      icon: CalendarDays,
    },
    {
      label: 'Customers',
      path: '/admin/customers',
      icon: Users,
    },
    {
      label: 'Staff',
      path: '/admin/staff',
      icon: Users,
    },
    {
      label: 'Services',
      path: '/admin/services',
      icon: Wrench,
    },
    {
      label: 'Payments',
      path: '/admin/payments',
      icon: CreditCard,
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: Activity,
    },
  ]

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
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        console.error(
          'Failed to load customers:',
          error
        )

        setCustomers([])
      } else {
        setCustomers(
          (data as Customer[]) ?? []
        )
      }

      setLoading(false)
    }

    loadCustomers()
  }, [])

  const filteredCustomers = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return customers
    }

    return customers.filter((customer) => {
      const fullName =
        customer.full_name?.toLowerCase() ?? ''

      const phone =
        customer.phone?.toLowerCase() ?? ''

      const id =
        customer.id.toLowerCase()

      return (
        fullName.includes(normalizedSearch) ||
        phone.includes(normalizedSearch) ||
        id.includes(normalizedSearch)
      )
    })
  }, [customers, searchTerm])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const renderNavigation = (
    mobile = false
  ) => (
    <nav className="mt-8 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon

        const active =
          item.path === '/admin/customers'

        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path)

              if (mobile) {
                setMobileMenuOpen(false)
              }
            }}
            className={
              active
                ? 'flex w-full items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-left text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
                : 'flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-slate-400 transition hover:border-white/5 hover:bg-white/5 hover:text-white'
            }
          >
            <Icon size={19} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <main className="se-page se-grid-bg relative min-h-screen overflow-hidden text-white">
      <div className="se-orb se-orb-indigo -left-32 top-20" />
      <div className="se-orb se-orb-cyan -right-28 top-40" />
      <div className="se-orb se-orb-violet bottom-[-140px] left-[45%]" />

      <div className="relative z-10 flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[290px] shrink-0 border-r border-white/10 bg-slate-950/55 p-6 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="se-icon-box h-12 w-12 rounded-2xl text-indigo-300">
              <Sparkles size={22} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">
                ServEase
              </p>

              <p className="mt-1 text-sm font-medium text-white">
                Admin Console
              </p>
            </div>
          </div>

          {renderNavigation()}

          <div className="mt-auto pt-8">
            <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                Access Level
              </p>

              <p className="mt-2 text-sm font-medium text-slate-300">
                Administrator
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/10 px-4 py-3 text-left text-rose-300 transition hover:border-rose-500/20 hover:bg-rose-500/10"
            >
              <LogOut size={19} />
              Logout
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-[290px] border-r border-white/10 bg-slate-950 p-6 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="se-icon-box h-11 w-11 rounded-2xl text-indigo-300">
                    <Sparkles size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
                      ServEase
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      Admin Console
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {renderNavigation(true)}

              <button
                onClick={handleLogout}
                className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-rose-500/10 px-4 py-3 text-left text-rose-300"
              >
                <LogOut size={19} />
                Logout
              </button>
            </aside>
          </>
        )}

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1">
          {/* MOBILE HEADER */}
          <div className="border-b border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="se-icon-box h-10 w-10 rounded-xl text-indigo-300">
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                    ServEase
                  </p>

                  <p className="text-sm font-medium">
                    Admin Console
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
            {/* PAGE HEADER */}
            <header className="se-glass rounded-[28px] px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="se-icon-box h-14 w-14 rounded-2xl text-cyan-300">
                    <UserRound size={25} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                      Customer Management
                    </p>

                    <h1 className="se-gradient-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                      Customers
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      View registered ServEase customer
                      profiles and contact information.
                    </p>
                  </div>
                </div>

                <div className="se-glass se-card-3d min-w-[170px] rounded-2xl px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Registered Customers
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {loading
                      ? '...'
                      : customers.length}
                  </p>
                </div>
              </div>
            </header>

            {/* CUSTOMERS PANEL */}
            <section className="se-glass mt-7 overflow-hidden rounded-[28px]">
              {/* SEARCH */}
              <div className="border-b border-white/10 px-6 py-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                      Customer Records
                    </p>

                    <h2 className="mt-2 text-xl font-semibold">
                      Registered Customers
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Search by customer name, phone, or profile ID.
                    </p>
                  </div>

                  <div className="relative w-full md:max-w-sm">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search customers"
                      className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                    />
                  </div>
                </div>

                <p className="mt-5 text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-white">
                    {filteredCustomers.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-white">
                    {customers.length}
                  </span>{' '}
                  customers
                </p>
              </div>

              {/* DATA */}
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading customers...
                    </p>
                  </div>
                </div>
              ) : customers.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <UserRound
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No customers found.
                    </p>
                  </div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No customers match your search.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/10 bg-white/[0.025]">
                        <tr>
                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Customer
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Phone
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Joined
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredCustomers.map((customer) => (
                          <tr
                            key={customer.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.035] last:border-0"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="se-icon-box h-11 w-11 rounded-xl text-cyan-300">
                                  <UserRound size={18} />
                                </div>

                                <div>
                                  <p className="font-medium text-white">
                                    {customer.full_name ||
                                      'Unnamed customer'}
                                  </p>

                                  <p className="mt-1 font-mono text-xs text-slate-600">
                                    {customer.id.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              {customer.phone ? (
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                  <Phone
                                    size={15}
                                    className="text-cyan-300"
                                  />

                                  {customer.phone}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-600">
                                  No phone
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-300">
                              {new Date(
                                customer.created_at
                              ).toLocaleDateString(
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

                  {/* MOBILE CARDS */}
                  <div className="grid gap-4 p-5 md:hidden">
                    {filteredCustomers.map((customer) => (
                      <article
                        key={customer.id}
                        className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/50 p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="se-icon-box h-12 w-12 rounded-2xl text-cyan-300">
                            <UserRound size={20} />
                          </div>

                          <div>
                            <h3 className="font-semibold">
                              {customer.full_name ||
                                'Unnamed customer'}
                            </h3>

                            <p className="mt-1 font-mono text-xs text-slate-600">
                              {customer.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-slate-600">
                              Phone
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {customer.phone ||
                                'No phone'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-600">
                              Joined
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {new Date(
                                customer.created_at
                              ).toLocaleDateString(
                                'en-PH',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminCustomers