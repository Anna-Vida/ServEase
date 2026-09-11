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
  UserRoundCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react'
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

type NavItem = {
  label: string
  path: string
  icon: React.ElementType
}

function AdminStaff() {
  const navigate = useNavigate()

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        console.error(
          'Failed to load staff:',
          error
        )

        setStaff([])
      } else {
        setStaff(
          (data as unknown as StaffMember[]) ?? []
        )
      }

      setLoading(false)
    }

    loadStaff()
  }, [])

  const filteredStaff = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    return staff.filter((member) => {
      const fullName =
        member.profile?.full_name
          ?.toLowerCase() ?? ''

      const phone =
        member.profile?.phone
          ?.toLowerCase() ?? ''

      const position =
        member.position?.toLowerCase() ?? ''

      const id =
        member.id.toLowerCase()

      const matchesSearch =
        normalizedSearch === '' ||
        fullName.includes(normalizedSearch) ||
        phone.includes(normalizedSearch) ||
        position.includes(normalizedSearch) ||
        id.includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'
          ? member.is_active
          : !member.is_active)

      return (
        matchesSearch &&
        matchesStatus
      )
    })
  }, [
    staff,
    searchTerm,
    statusFilter,
  ])

  const activeStaffCount = useMemo(() => {
    return staff.filter(
      (member) => member.is_active
    ).length
  }, [staff])

  const inactiveStaffCount = useMemo(() => {
    return staff.filter(
      (member) => !member.is_active
    ).length
  }, [staff])

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
          item.path === '/admin/staff'

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
                ? 'flex w-full items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left text-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.08)]'
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
      {/* BACKGROUND */}
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

        {/* MAIN */}
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
            {/* HEADER */}
            <header className="se-glass rounded-[28px] px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                  <div className="se-icon-box h-14 w-14 rounded-2xl text-amber-300">
                    <UserRoundCheck size={25} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                      Staff Management
                    </p>

                    <h1 className="se-gradient-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                      Staff
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      View ServEase staff profiles,
                      positions, contact details, and
                      active status.
                    </p>
                  </div>
                </div>

                {/* REAL STAFF STATS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="se-glass se-card-3d min-w-[115px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-500">
                      Total
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : staff.length}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[115px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-emerald-400">
                      Active
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : activeStaffCount}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[115px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-500">
                      Inactive
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : inactiveStaffCount}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* STAFF RECORDS */}
            <section className="se-glass mt-7 overflow-hidden rounded-[28px]">
              {/* FILTERS */}
              <div className="border-b border-white/10 px-6 py-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                      Staff Records
                    </p>

                    <h2 className="mt-2 text-xl font-semibold">
                      Staff Members
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Search real staff profiles by name,
                      position, phone, or profile ID.
                    </p>
                  </div>

                  <div className="grid w-full gap-3 sm:grid-cols-[1fr_180px] xl:max-w-2xl">
                    <div className="relative">
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
                        placeholder="Search staff"
                        className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value
                        )
                      }
                      className="se-input rounded-2xl px-4 py-3.5 text-sm"
                    >
                      <option
                        value="all"
                        className="bg-slate-900"
                      >
                        All statuses
                      </option>

                      <option
                        value="active"
                        className="bg-slate-900"
                      >
                        Active
                      </option>

                      <option
                        value="inactive"
                        className="bg-slate-900"
                      >
                        Inactive
                      </option>
                    </select>
                  </div>
                </div>

                <p className="mt-5 text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-white">
                    {filteredStaff.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-white">
                    {staff.length}
                  </span>{' '}
                  staff members
                </p>
              </div>

              {/* DATA */}
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-300" />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading staff...
                    </p>
                  </div>
                </div>
              ) : staff.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <UserRoundCheck
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No staff members found.
                    </p>
                  </div>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No staff match your current filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/10 bg-white/[0.025]">
                        <tr>
                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Staff Member
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Position
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Phone
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Status
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Bio
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredStaff.map((member) => (
                          <tr
                            key={member.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.035] last:border-0"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="se-icon-box h-11 w-11 rounded-xl text-amber-300">
                                  <UserRoundCheck
                                    size={18}
                                  />
                                </div>

                                <div>
                                  <p className="font-medium text-white">
                                    {member.profile
                                      ?.full_name ??
                                      'Unnamed staff'}
                                  </p>

                                  <p className="mt-1 font-mono text-xs text-slate-600">
                                    {member.id.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-300">
                              {member.position ||
                                'No position'}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-300">
                              {member.profile?.phone ||
                                'No phone'}
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={
                                  member.is_active
                                    ? 'inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300'
                                    : 'inline-flex rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-500'
                                }
                              >
                                {member.is_active
                                  ? 'Active'
                                  : 'Inactive'}
                              </span>
                            </td>

                            <td className="max-w-[320px] px-6 py-5 text-sm text-slate-500">
                              {member.bio ||
                                'No bio'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS */}
                  <div className="grid gap-4 p-5 lg:hidden">
                    {filteredStaff.map((member) => (
                      <article
                        key={member.id}
                        className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/50 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="se-icon-box h-12 w-12 rounded-2xl text-amber-300">
                              <UserRoundCheck
                                size={20}
                              />
                            </div>

                            <div>
                              <h3 className="font-semibold">
                                {member.profile?.full_name ??
                                  'Unnamed staff'}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                {member.position ||
                                  'No position'}
                              </p>
                            </div>
                          </div>

                          <span
                            className={
                              member.is_active
                                ? 'rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300'
                                : 'rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-medium text-slate-500'
                            }
                          >
                            {member.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-slate-600">
                              Phone
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {member.profile?.phone ||
                                'No phone'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-600">
                              Staff ID
                            </p>

                            <p className="mt-1 font-mono text-sm text-slate-400">
                              {member.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>

                        {member.bio && (
                          <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                            <p className="text-xs text-slate-600">
                              Bio
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {member.bio}
                            </p>
                          </div>
                        )}
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

export default AdminStaff