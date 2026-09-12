import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Sparkles,
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

  const [customers, setCustomers] =
    useState<Customer[]>([])

  const [loading, setLoading] =
    useState(true)

  const [searchTerm, setSearchTerm] =
    useState('')

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

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
        customer.full_name
          ?.toLowerCase() ?? ''

      const phone =
        customer.phone
          ?.toLowerCase() ?? ''

      const id =
        customer.id.toLowerCase()

      return (
        fullName.includes(normalizedSearch) ||
        phone.includes(normalizedSearch) ||
        id.includes(normalizedSearch)
      )
    })
  }, [
    customers,
    searchTerm,
  ])

  const getInitials = (
    name: string
  ) => {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const formatDate = (
    value: string
  ) => {
    return new Date(
      value
    ).toLocaleDateString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const renderNavigation = (
    mobile = false
  ) => (
    <nav className="mt-8 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon

        const active =
          item.path ===
          '/admin/customers'

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
                ? 'flex w-full items-center gap-3 rounded-xl bg-[#ffe9db] px-4 py-3 text-left font-semibold text-[#c45231]'
                : 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-[#75675f] transition hover:bg-[#fff0e6] hover:text-[#1c1410]'
            }
          >
            <Icon size={18} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <main className="min-h-screen bg-[#fff8f1] text-[#1c1410]">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[270px] shrink-0 border-r border-[#f1ded0] bg-[#fffaf5] p-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight">
                ServEase
              </p>

              <p className="text-xs text-[#8b7c73]">
                Admin Console
              </p>
            </div>
          </div>

          {renderNavigation()}

          <div className="mt-auto border-t border-[#ead7ca] pt-6">
            <p className="px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#a09187]">
              Access level
            </p>

            <p className="mt-2 px-4 text-sm font-semibold">
              Administrator
            </p>

            <button
              onClick={handleLogout}
              className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#c9472d] transition hover:bg-[#fff0ec]"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-[#1c1410]/35 lg:hidden"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-[#f1ded0] bg-[#fffaf5] p-6 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
                    <Sparkles size={18} />
                  </div>

                  <div>
                    <p className="font-extrabold">
                      ServEase
                    </p>

                    <p className="text-xs text-[#8b7c73]">
                      Admin Console
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="rounded-lg border border-[#ead7ca] bg-white p-2 text-[#74675f]"
                >
                  <X size={18} />
                </button>
              </div>

              {renderNavigation(true)}

              <button
                onClick={handleLogout}
                className="mt-8 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#c9472d] hover:bg-[#fff0ec]"
              >
                <LogOut size={18} />
                Logout
              </button>
            </aside>
          </>
        )}

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          {/* MOBILE HEADER */}
          <div className="border-b border-[#f1ded0] bg-[#fffaf5] px-5 py-4 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
                  <Sparkles size={17} />
                </div>

                <div>
                  <p className="font-bold">
                    ServEase
                  </p>

                  <p className="text-xs text-[#8b7c73]">
                    Admin Console
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-lg border border-[#ead7ca] bg-white p-2.5 text-[#493c35]"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1500px] px-6 py-10 lg:px-10 lg:py-12">
            {/* HEADER */}
            <header className="flex flex-col gap-8 border-b border-[#ead7ca] pb-9 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#ff6b4a]">
                  Customer management
                </p>

                <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                  Registered{' '}
                  <span className="se-gradient-text">
                    Customers
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74675f] sm:text-base">
                  View ServEase customer profiles,
                  contact information, and account
                  registration dates.
                </p>
              </div>

              <div className="border-l-2 border-[#ffb020] pl-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a09187]">
                  Total Customers
                </p>

                <p className="mt-1 text-4xl font-extrabold">
                  {loading
                    ? '...'
                    : customers.length}
                </p>
              </div>
            </header>

            {/* SEARCH */}
            <section className="border-b border-[#ead7ca] py-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                    Customer records
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    Customer Directory
                  </h2>

                  <p className="mt-2 text-sm text-[#74675f]">
                    Search by customer name,
                    phone number, or profile ID.
                  </p>
                </div>

                <div className="relative w-full md:max-w-sm">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a09187]"
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
                    className="se-input se-input-icon-left h-11 text-sm"
                  />
                </div>
              </div>

              <p className="mt-5 text-sm text-[#8b7c73]">
                Showing{' '}
                <span className="font-semibold text-[#1c1410]">
                  {filteredCustomers.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[#1c1410]">
                  {customers.length}
                </span>{' '}
                customers
              </p>
            </section>

            {/* CUSTOMER DATA */}
            <section className="pt-8">
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                    <p className="mt-4 text-sm text-[#8b7c73]">
                      Loading customers...
                    </p>
                  </div>
                </div>
              ) : customers.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <p className="text-sm text-[#8b7c73]">
                    No customers found.
                  </p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-[#b6a79d]"
                    />

                    <p className="mt-4 text-sm text-[#8b7c73]">
                      No customers match your search.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-hidden rounded-2xl border border-[#ead7ca] bg-white shadow-[0_8px_30px_rgba(91,62,47,0.04)] md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#ead7ca] bg-[#fffaf6]">
                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Customer
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Phone
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Joined
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Customer ID
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#f1e4db]">
                          {filteredCustomers.map(
                            (customer) => {
                              const customerName =
                                customer.full_name ||
                                'Unnamed customer'

                              return (
                                <tr
                                  key={customer.id}
                                  className="transition-colors hover:bg-[#fffaf6]"
                                >
                                  {/* CUSTOMER */}
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-xs font-extrabold text-[#c45231] ring-1 ring-[#f2d7c7]">
                                        {getInitials(
                                          customerName
                                        )}
                                      </div>

                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-[#1c1410]">
                                          {
                                            customerName
                                          }
                                        </p>

                                        <p className="mt-0.5 text-xs text-[#9a8a80]">
                                          Customer
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* PHONE */}
                                  <td className="px-5 py-4">
                                    {customer.phone ? (
                                      <p className="font-medium text-[#493c35]">
                                        {
                                          customer.phone
                                        }
                                      </p>
                                    ) : (
                                      <span className="text-[#a09187]">
                                        No phone
                                      </span>
                                    )}
                                  </td>

                                  {/* JOINED */}
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <p className="font-medium text-[#493c35]">
                                      {formatDate(
                                        customer.created_at
                                      )}
                                    </p>

                                    <p className="mt-0.5 text-xs text-[#9a8a80]">
                                      Registration date
                                    </p>
                                  </td>

                                  {/* ID */}
                                  <td className="px-5 py-4">
                                    <code
                                      className="rounded-md bg-[#fff4ec] px-2.5 py-1.5 text-xs text-[#8b6f61]"
                                      title={
                                        customer.id
                                      }
                                    >
                                      {customer.id.slice(
                                        0,
                                        8
                                      )}
                                      ...
                                    </code>
                                  </td>
                                </tr>
                              )
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MOBILE */}
                  <div className="overflow-hidden rounded-2xl border border-[#ead7ca] bg-white md:hidden">
                    <div className="divide-y divide-[#f1e4db]">
                      {filteredCustomers.map(
                        (customer) => {
                          const customerName =
                            customer.full_name ||
                            'Unnamed customer'

                          return (
                            <article
                              key={customer.id}
                              className="p-5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-xs font-extrabold text-[#c45231] ring-1 ring-[#f2d7c7]">
                                  {getInitials(
                                    customerName
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <h3 className="truncate font-bold">
                                    {
                                      customerName
                                    }
                                  </h3>

                                  <p className="mt-1 text-xs text-[#9a8a80]">
                                    Customer
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-4 border-t border-[#f1e4db] pt-4 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Phone
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-[#493c35]">
                                    {customer.phone ||
                                      'No phone'}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Joined
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-[#493c35]">
                                    {formatDate(
                                      customer.created_at
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 rounded-xl bg-[#fffaf6] px-4 py-3">
                                <p className="text-xs font-medium text-[#9a8a80]">
                                  Customer ID
                                </p>

                                <p className="mt-1 break-all font-mono text-xs text-[#74675f]">
                                  {customer.id}
                                </p>
                              </div>
                            </article>
                          )
                        }
                      )}
                    </div>
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