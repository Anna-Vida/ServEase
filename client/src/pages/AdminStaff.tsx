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

  const [staff, setStaff] =
    useState<StaffMember[]>([])

  const [loading, setLoading] =
    useState(true)

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('all')

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
          (data as unknown as StaffMember[]) ??
            []
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
            <header className="border-b border-[#ead7ca] pb-9">
              <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#ff6b4a]">
                    Staff management
                  </p>

                  <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                    Staff{' '}
                    <span className="se-gradient-text">
                      Directory
                    </span>
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74675f] sm:text-base">
                    View ServEase staff profiles,
                    positions, contact details, bios,
                    and active status.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-8 border-t border-[#ead7ca] pt-6 xl:border-t-0 xl:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#a09187]">
                      Total
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : staff.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#16845b]">
                      Active
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : activeStaffCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8b7c73]">
                      Inactive
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : inactiveStaffCount}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* FILTERS */}
            <section className="border-b border-[#ead7ca] py-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                    Staff records
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    Staff Members
                  </h2>

                  <p className="mt-2 text-sm text-[#74675f]">
                    Search by name, position, phone,
                    or profile ID.
                  </p>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-[1fr_180px] xl:max-w-2xl">
                  <div className="relative">
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
                      placeholder="Search staff"
                      className="se-input se-input-icon-left h-11 text-sm"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="se-input h-11 text-sm"
                  >
                    <option value="all">
                      All statuses
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              <p className="mt-5 text-sm text-[#8b7c73]">
                Showing{' '}
                <span className="font-semibold text-[#1c1410]">
                  {filteredStaff.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[#1c1410]">
                  {staff.length}
                </span>{' '}
                staff members
              </p>
            </section>

            {/* DATA */}
            <section className="pt-8">
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                    <p className="mt-4 text-sm text-[#8b7c73]">
                      Loading staff...
                    </p>
                  </div>
                </div>
              ) : staff.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <p className="text-sm text-[#8b7c73]">
                    No staff members found.
                  </p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-[#b6a79d]"
                    />

                    <p className="mt-4 text-sm text-[#8b7c73]">
                      No staff match your current filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-hidden rounded-2xl border border-[#ead7ca] bg-white shadow-[0_8px_30px_rgba(91,62,47,0.04)] lg:block">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#ead7ca] bg-[#fffaf6]">
                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Staff Member
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Position
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Phone
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Status
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Bio
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Staff ID
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#f1e4db]">
                          {filteredStaff.map(
                            (member) => {
                              const fullName =
                                member.profile
                                  ?.full_name ??
                                'Unnamed staff'

                              return (
                                <tr
                                  key={member.id}
                                  className="transition-colors hover:bg-[#fffaf6]"
                                >
                                  {/* STAFF MEMBER */}
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-xs font-extrabold text-[#c45231] ring-1 ring-[#f2d7c7]">
                                        {getInitials(
                                          fullName
                                        )}
                                      </div>

                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-[#1c1410]">
                                          {
                                            fullName
                                          }
                                        </p>

                                        <p className="mt-0.5 text-xs text-[#9a8a80]">
                                          Staff member
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* POSITION */}
                                  <td className="px-5 py-4">
                                    <p className="font-medium text-[#493c35]">
                                      {member.position ||
                                        'No position'}
                                    </p>
                                  </td>

                                  {/* PHONE */}
                                  <td className="px-5 py-4">
                                    <p
                                      className={
                                        member.profile
                                          ?.phone
                                          ? 'font-medium text-[#493c35]'
                                          : 'text-[#a09187]'
                                      }
                                    >
                                      {member.profile
                                        ?.phone ||
                                        'No phone'}
                                    </p>
                                  </td>

                                  {/* STATUS */}
                                  <td className="px-5 py-4">
                                    <span
                                      className={
                                        member.is_active
                                          ? 'inline-flex items-center gap-1.5 rounded-full border border-[#bfe7d6] bg-[#e9f8f1] px-3 py-1.5 text-xs font-bold text-[#16845b]'
                                          : 'inline-flex items-center gap-1.5 rounded-full border border-[#e4d8d0] bg-[#f4eee9] px-3 py-1.5 text-xs font-bold text-[#8b7c73]'
                                      }
                                    >
                                      <span
                                        className={
                                          member.is_active
                                            ? 'h-1.5 w-1.5 rounded-full bg-[#16845b]'
                                            : 'h-1.5 w-1.5 rounded-full bg-[#a09187]'
                                        }
                                      />

                                      {member.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                    </span>
                                  </td>

                                  {/* BIO */}
                                  <td className="max-w-[300px] px-5 py-4">
                                    <p
                                      className="truncate text-[#74675f]"
                                      title={
                                        member.bio ??
                                        ''
                                      }
                                    >
                                      {member.bio ||
                                        'No bio'}
                                    </p>
                                  </td>

                                  {/* ID */}
                                  <td className="px-5 py-4">
                                    <code
                                      className="rounded-md bg-[#fff4ec] px-2.5 py-1.5 text-xs text-[#8b6f61]"
                                      title={
                                        member.id
                                      }
                                    >
                                      {member.id.slice(
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

                  {/* MOBILE / TABLET */}
                  <div className="overflow-hidden rounded-2xl border border-[#ead7ca] bg-white lg:hidden">
                    <div className="divide-y divide-[#f1e4db]">
                      {filteredStaff.map(
                        (member) => {
                          const fullName =
                            member.profile
                              ?.full_name ??
                            'Unnamed staff'

                          return (
                            <article
                              key={member.id}
                              className="p-5 sm:p-6"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-xs font-extrabold text-[#c45231] ring-1 ring-[#f2d7c7]">
                                    {getInitials(
                                      fullName
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <h3 className="truncate font-bold">
                                      {
                                        fullName
                                      }
                                    </h3>

                                    <p className="mt-1 truncate text-sm text-[#74675f]">
                                      {member.position ||
                                        'No position'}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={
                                    member.is_active
                                      ? 'shrink-0 rounded-full border border-[#bfe7d6] bg-[#e9f8f1] px-3 py-1.5 text-xs font-bold text-[#16845b]'
                                      : 'shrink-0 rounded-full border border-[#e4d8d0] bg-[#f4eee9] px-3 py-1.5 text-xs font-bold text-[#8b7c73]'
                                  }
                                >
                                  {member.is_active
                                    ? 'Active'
                                    : 'Inactive'}
                                </span>
                              </div>

                              <div className="mt-5 grid gap-4 border-t border-[#f1e4db] pt-4 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Phone
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-[#493c35]">
                                    {member.profile
                                      ?.phone ||
                                      'No phone'}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Staff ID
                                  </p>

                                  <p className="mt-1 font-mono text-xs text-[#74675f]">
                                    {member.id.slice(
                                      0,
                                      8
                                    )}
                                    ...
                                  </p>
                                </div>
                              </div>

                              {member.bio && (
                                <div className="mt-4 rounded-xl bg-[#fffaf6] px-4 py-3">
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Bio
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-[#65574f]">
                                    {
                                      member.bio
                                    }
                                  </p>
                                </div>
                              )}
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

export default AdminStaff