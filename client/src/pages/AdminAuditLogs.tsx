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
  SlidersHorizontal,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type AuditLog = {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string

  user: {
    full_name: string
    role: string
  } | null
}

type NavItem = {
  label: string
  path: string
  icon: React.ElementType
}

function AdminAuditLogs() {
  const navigate = useNavigate()

  const [logs, setLogs] =
    useState<AuditLog[]>([])

  const [loading, setLoading] =
    useState(true)

  const [searchTerm, setSearchTerm] =
    useState('')

  const [actionFilter, setActionFilter] =
    useState('all')

  const [roleFilter, setRoleFilter] =
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
    const loadAuditLogs = async () => {
      setLoading(true)

      const { data, error } =
        await supabase
          .from('audit_logs')
          .select(`
            id,
            action,
            entity_type,
            entity_id,
            details,
            created_at,
            user:profiles!audit_logs_user_id_fkey (
              full_name,
              role
            )
          `)
          .order('created_at', {
            ascending: false,
          })

      if (error) {
        console.error(
          'Failed to load audit logs:',
          error
        )

        setLogs([])
        setLoading(false)
        return
      }

      setLogs(
        (data as unknown as AuditLog[]) ??
          []
      )

      setLoading(false)
    }

    loadAuditLogs()
  }, [])

  const getActionLabel = (
    action: string
  ) => {
    switch (action) {
      case 'booking_status_changed':
        return 'Booking status changed'

      case 'staff_booking_status_changed':
        return 'Staff changed booking status'

      case 'customer_cancelled_booking':
        return 'Customer cancelled booking'

      case 'staff_assigned_to_booking':
        return 'Staff assigned'

      case 'staff_unassigned_from_booking':
        return 'Staff unassigned'

      case 'payment_recorded':
        return 'Payment recorded'

      case 'payment_status_changed':
        return 'Payment status changed'

      case 'service_created':
        return 'Service created'

      case 'service_updated':
        return 'Service updated'

      case 'service_activated':
        return 'Service activated'

      case 'service_deactivated':
        return 'Service deactivated'

      default:
        return action
          .replaceAll('_', ' ')
          .replace(
            /\b\w/g,
            (letter) =>
              letter.toUpperCase()
          )
    }
  }

  const getActionStyles = (
    action: string
  ) => {
    if (
      action.includes('payment')
    ) {
      return 'border-[#bfe7d6] bg-[#e9f8f1] text-[#16845b]'
    }

    if (
      action.includes('service')
    ) {
      return 'border-[#ead5ff] bg-[#f5ecff] text-[#7552a8]'
    }

    if (
      action.includes('cancelled') ||
      action.includes('deactivated')
    ) {
      return 'border-[#f3c7bb] bg-[#fff0ec] text-[#c9472d]'
    }

    if (
      action.includes('staff_assigned') ||
      action.includes('staff_unassigned')
    ) {
      return 'border-[#f4dda5] bg-[#fff3d7] text-[#b26a00]'
    }

    if (
      action.includes('booking')
    ) {
      return 'border-[#cfe1f5] bg-[#eaf3ff] text-[#3569a6]'
    }

    return 'border-[#f1d6c5] bg-[#fff3ea] text-[#b95736]'
  }

  const getDetailsText = (
    details: Record<string, unknown> | null
  ) => {
    if (!details) {
      return '—'
    }

    if (
      details.previous_status &&
      details.new_status
    ) {
      return `${String(
        details.previous_status
      )} → ${String(
        details.new_status
      )}`
    }

    if (
      details.service &&
      details.amount !== undefined &&
      details.amount !== null
    ) {
      return `${String(
        details.service
      )} • ₱${Number(
        details.amount
      ).toLocaleString(
        'en-PH',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`
    }

    if (
      details.name &&
      details.price !== undefined &&
      details.price !== null
    ) {
      return `${String(
        details.name
      )} • ₱${Number(
        details.price
      ).toLocaleString(
        'en-PH',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`
    }

    if (
      details.service_name
    ) {
      return String(
        details.service_name
      )
    }

    if (
      details.service
    ) {
      return String(
        details.service
      )
    }

    if (
      details.new_staff_name
    ) {
      return String(
        details.new_staff_name
      )
    }

    if (
      details.previous_staff_name
    ) {
      return String(
        details.previous_staff_name
      )
    }

    if (
      details.customer
    ) {
      return String(
        details.customer
      )
    }

    return '—'
  }

  const actionOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          logs.map(
            (log) => log.action
          )
        )
      ).sort((a, b) =>
        getActionLabel(a).localeCompare(
          getActionLabel(b)
        )
      )
    }, [logs])

  const filteredLogs =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase()

      return logs.filter(
        (log) => {
          const userName =
            log.user?.full_name
              ?.toLowerCase() ?? ''

          const role =
            log.user?.role
              ?.toLowerCase() ?? ''

          const action =
            log.action.toLowerCase()

          const actionLabel =
            getActionLabel(
              log.action
            ).toLowerCase()

          const entityType =
            log.entity_type
              ?.toLowerCase() ?? ''

          const entityId =
            log.entity_id
              ?.toLowerCase() ?? ''

          const detailsText =
            getDetailsText(
              log.details
            ).toLowerCase()

          const matchesSearch =
            normalizedSearch === '' ||
            userName.includes(
              normalizedSearch
            ) ||
            role.includes(
              normalizedSearch
            ) ||
            action.includes(
              normalizedSearch
            ) ||
            actionLabel.includes(
              normalizedSearch
            ) ||
            entityType.includes(
              normalizedSearch
            ) ||
            entityId.includes(
              normalizedSearch
            ) ||
            detailsText.includes(
              normalizedSearch
            )

          const matchesAction =
            actionFilter === 'all' ||
            log.action ===
              actionFilter

          const matchesRole =
            roleFilter === 'all' ||
            log.user?.role ===
              roleFilter

          return (
            matchesSearch &&
            matchesAction &&
            matchesRole
          )
        }
      )
    }, [
      logs,
      searchTerm,
      actionFilter,
      roleFilter,
    ])

  const adminLogsCount =
    useMemo(() => {
      return logs.filter(
        (log) =>
          log.user?.role ===
          'admin'
      ).length
    }, [logs])

  const staffLogsCount =
    useMemo(() => {
      return logs.filter(
        (log) =>
          log.user?.role ===
          'staff'
      ).length
    }, [logs])

  const customerLogsCount =
    useMemo(() => {
      return logs.filter(
        (log) =>
          log.user?.role ===
          'customer'
      ).length
    }, [logs])

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

  const formatDateTime = (
    value: string
  ) => {
    return new Date(
      value
    ).toLocaleString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    )
  }

  const resetFilters = () => {
    setSearchTerm('')
    setActionFilter('all')
    setRoleFilter('all')
  }

  const hasActiveFilters =
    searchTerm !== '' ||
    actionFilter !== 'all' ||
    roleFilter !== 'all'

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
          '/admin/audit-logs'

        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path)

              if (mobile) {
                setMobileMenuOpen(
                  false
                )
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
                setMobileMenuOpen(
                  false
                )
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
                    setMobileMenuOpen(
                      false
                    )
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
                    System activity
                  </p>

                  <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                    Audit{' '}
                    <span className="se-gradient-text">
                      Logs
                    </span>
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74675f] sm:text-base">
                    Review recorded ServEase actions
                    performed by administrators,
                    staff, and customers.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-[#ead7ca] pt-6 sm:grid-cols-4 xl:border-t-0 xl:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#a09187]">
                      Total
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : logs.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7552a8]">
                      Admin
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : adminLogsCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#b26a00]">
                      Staff
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : staffLogsCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#3569a6]">
                      Customer
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : customerLogsCount}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* FILTER AREA */}
            <section className="border-b border-[#ead7ca] py-8">
              <div className="flex items-center gap-3">
                <SlidersHorizontal
                  size={18}
                  className="text-[#ff6b4a]"
                />

                <div>
                  <h2 className="font-bold">
                    Search & Filters
                  </h2>

                  <p className="mt-1 text-xs text-[#8b7c73]">
                    Search recorded activity from
                    the ServEase audit table.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_260px_180px]">
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
                    placeholder="Search user, action, entity, or details"
                    className="se-input se-input-icon-left h-11 text-sm"
                  />
                </div>

                <select
                  value={actionFilter}
                  onChange={(event) =>
                    setActionFilter(
                      event.target.value
                    )
                  }
                  className="se-input h-11 text-sm"
                >
                  <option value="all">
                    All actions
                  </option>

                  {actionOptions.map(
                    (action) => (
                      <option
                        key={action}
                        value={action}
                      >
                        {getActionLabel(
                          action
                        )}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(
                      event.target.value
                    )
                  }
                  className="se-input h-11 text-sm"
                >
                  <option value="all">
                    All roles
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                  <option value="staff">
                    Staff
                  </option>

                  <option value="customer">
                    Customer
                  </option>
                </select>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#8b7c73]">
                  Showing{' '}
                  <span className="font-semibold text-[#1c1410]">
                    {filteredLogs.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-[#1c1410]">
                    {logs.length}
                  </span>{' '}
                  logs
                </p>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#8b6f61] transition hover:bg-[#fff0e7] hover:text-[#c45231]"
                  >
                    <X size={14} />
                    Clear filters
                  </button>
                )}
              </div>
            </section>

            {/* ACTIVITY */}
            <section className="pt-10">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                  Activity history
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  Recorded Actions
                </h2>

                <p className="mt-2 text-sm text-[#74675f]">
                  Each entry below comes directly
                  from the ServEase audit log.
                </p>
              </div>

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                    <p className="mt-4 text-sm text-[#8b7c73]">
                      Loading audit logs...
                    </p>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <p className="text-sm text-[#8b7c73]">
                    No audit logs found.
                  </p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-[#b6a79d]"
                    />

                    <p className="mt-4 text-sm text-[#8b7c73]">
                      No audit logs match your current filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-hidden rounded-2xl border border-[#ead7ca] bg-white shadow-[0_8px_30px_rgba(91,62,47,0.04)] xl:block">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#ead7ca] bg-[#fffaf6]">
                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              User
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Action
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Details
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Entity
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Date & Time
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#f1e4db]">
                          {filteredLogs.map(
                            (log) => {
                              const userName =
                                log.user
                                  ?.full_name ??
                                'Unknown user'

                              return (
                                <tr
                                  key={log.id}
                                  className="transition-colors hover:bg-[#fffaf6]"
                                >
                                  {/* USER */}
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-xs font-extrabold text-[#c45231] ring-1 ring-[#f2d7c7]">
                                        {getInitials(
                                          userName
                                        )}
                                      </div>

                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-[#1c1410]">
                                          {
                                            userName
                                          }
                                        </p>

                                        <p className="mt-0.5 text-xs capitalize text-[#9a8a80]">
                                          {log.user
                                            ?.role ??
                                            'user'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* ACTION */}
                                  <td className="px-5 py-4">
                                    <span
                                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getActionStyles(
                                        log.action
                                      )}`}
                                    >
                                      {getActionLabel(
                                        log.action
                                      )}
                                    </span>
                                  </td>

                                  {/* DETAILS */}
                                  <td className="max-w-[320px] px-5 py-4">
                                    <p
                                      className="truncate text-[#65574f]"
                                      title={getDetailsText(
                                        log.details
                                      )}
                                    >
                                      {getDetailsText(
                                        log.details
                                      )}
                                    </p>
                                  </td>

                                  {/* ENTITY */}
                                  <td className="px-5 py-4">
                                    <p className="font-medium capitalize text-[#493c35]">
                                      {log.entity_type ??
                                        '—'}
                                    </p>

                                    {log.entity_id && (
                                      <code
                                        className="mt-1 inline-block max-w-[180px] truncate rounded-md bg-[#fff4ec] px-2 py-1 text-xs text-[#8b6f61]"
                                        title={
                                          log.entity_id
                                        }
                                      >
                                        {log.entity_id.slice(
                                          0,
                                          8
                                        )}
                                        ...
                                      </code>
                                    )}
                                  </td>

                                  {/* DATE */}
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <p className="font-medium text-[#493c35]">
                                      {formatDateTime(
                                        log.created_at
                                      )}
                                    </p>

                                    <p className="mt-0.5 text-xs text-[#9a8a80]">
                                      Recorded activity
                                    </p>
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
                  <div className="overflow-hidden rounded-2xl border border-[#ead7ca] bg-white xl:hidden">
                    <div className="divide-y divide-[#f1e4db]">
                      {filteredLogs.map(
                        (log) => {
                          const userName =
                            log.user
                              ?.full_name ??
                            'Unknown user'

                          return (
                            <article
                              key={log.id}
                              className="p-5 sm:p-6"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-xs font-extrabold text-[#c45231] ring-1 ring-[#f2d7c7]">
                                    {getInitials(
                                      userName
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <h3 className="truncate font-bold">
                                      {
                                        userName
                                      }
                                    </h3>

                                    <p className="mt-1 text-xs capitalize text-[#9a8a80]">
                                      {log.user
                                        ?.role ??
                                        'user'}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${getActionStyles(
                                    log.action
                                  )}`}
                                >
                                  {getActionLabel(
                                    log.action
                                  )}
                                </span>
                              </div>

                              <div className="mt-5 grid gap-4 border-t border-[#f1e4db] pt-4 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Details
                                  </p>

                                  <p className="mt-1 text-sm text-[#493c35]">
                                    {getDetailsText(
                                      log.details
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Entity
                                  </p>

                                  <p className="mt-1 text-sm font-medium capitalize text-[#493c35]">
                                    {log.entity_type ??
                                      '—'}
                                  </p>
                                </div>
                              </div>

                              {log.entity_id && (
                                <div className="mt-4 rounded-xl bg-[#fffaf6] px-4 py-3">
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Entity ID
                                  </p>

                                  <p className="mt-1 break-all font-mono text-xs text-[#74675f]">
                                    {log.entity_id}
                                  </p>
                                </div>
                              )}

                              <div className="mt-4 border-t border-[#f1e4db] pt-4">
                                <p className="text-xs text-[#8b7c73]">
                                  {formatDateTime(
                                    log.created_at
                                  )}
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

export default AdminAuditLogs