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
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
    }

    if (
      action.includes('service')
    ) {
      return 'border-violet-400/20 bg-violet-400/10 text-violet-300'
    }

    if (
      action.includes('cancelled') ||
      action.includes('deactivated')
    ) {
      return 'border-rose-400/20 bg-rose-400/10 text-rose-300'
    }

    if (
      action.includes('staff_assigned') ||
      action.includes('staff_unassigned')
    ) {
      return 'border-amber-400/20 bg-amber-400/10 text-amber-300'
    }

    if (
      action.includes('booking')
    ) {
      return 'border-indigo-400/20 bg-indigo-400/10 text-indigo-300'
    }

    return 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'
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
            actionFilter ===
              'all' ||
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
    <nav className="mt-8 space-y-2">
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
                ? 'flex w-full items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-left text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.08)]'
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
                setMobileMenuOpen(
                  false
                )
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-[290px] border-r border-white/10 bg-slate-950 p-6 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="se-icon-box h-11 w-11 rounded-2xl text-indigo-300">
                    <Sparkles
                      size={20}
                    />
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
                    setMobileMenuOpen(
                      false
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {renderNavigation(
                true
              )}

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
                  <Sparkles
                    size={18}
                  />
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
                  setMobileMenuOpen(
                    true
                  )
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
                  <div className="se-icon-box h-14 w-14 rounded-2xl text-violet-300">
                    <Activity
                      size={25}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
                      System Activity
                    </p>

                    <h1 className="se-gradient-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                      Audit Logs
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      Review recorded ServEase
                      actions performed by
                      administrators, staff,
                      and customers.
                    </p>
                  </div>
                </div>

                {/* REAL COUNTS */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="se-glass se-card-3d min-w-[105px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-500">
                      Total
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : logs.length}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[105px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-violet-400">
                      Admin
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : adminLogsCount}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[105px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-amber-400">
                      Staff
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : staffLogsCount}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[105px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-cyan-400">
                      Customer
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : customerLogsCount}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* AUDIT WORKSPACE */}
            <section className="se-glass mt-7 overflow-hidden rounded-[28px]">
              {/* FILTER AREA */}
              <div className="border-b border-white/10 px-6 py-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="se-icon-box h-10 w-10 rounded-xl text-violet-300">
                    <SlidersHorizontal
                      size={18}
                    />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Search & Filters
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Search real recorded
                      activity from the
                      ServEase audit table.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px_180px]">
                  {/* SEARCH */}
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
                      placeholder="Search user, action, entity, or details"
                      className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                    />
                  </div>

                  {/* ACTION */}
                  <select
                    value={actionFilter}
                    onChange={(event) =>
                      setActionFilter(
                        event.target.value
                      )
                    }
                    className="se-input rounded-2xl px-4 py-3.5 text-sm"
                  >
                    <option
                      value="all"
                      className="bg-slate-900"
                    >
                      All actions
                    </option>

                    {actionOptions.map(
                      (action) => (
                        <option
                          key={action}
                          value={action}
                          className="bg-slate-900"
                        >
                          {getActionLabel(
                            action
                          )}
                        </option>
                      )
                    )}
                  </select>

                  {/* ROLE */}
                  <select
                    value={roleFilter}
                    onChange={(event) =>
                      setRoleFilter(
                        event.target.value
                      )
                    }
                    className="se-input rounded-2xl px-4 py-3.5 text-sm"
                  >
                    <option
                      value="all"
                      className="bg-slate-900"
                    >
                      All roles
                    </option>

                    <option
                      value="admin"
                      className="bg-slate-900"
                    >
                      Admin
                    </option>

                    <option
                      value="staff"
                      className="bg-slate-900"
                    >
                      Staff
                    </option>

                    <option
                      value="customer"
                      className="bg-slate-900"
                    >
                      Customer
                    </option>
                  </select>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Showing{' '}
                    <span className="font-semibold text-white">
                      {filteredLogs.length}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-white">
                      {logs.length}
                    </span>{' '}
                    logs
                  </p>

                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="se-btn-secondary flex items-center gap-2 rounded-xl px-4 py-2 text-xs"
                    >
                      <X size={15} />
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* LOG HEADER */}
              <div className="border-b border-white/10 bg-white/[0.015] px-6 py-5 sm:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                  Activity History
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Recorded Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Each entry below comes
                  directly from the ServEase
                  audit log.
                </p>
              </div>

              {/* DATA */}
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading audit logs...
                    </p>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Activity
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No audit logs found.
                    </p>
                  </div>
                </div>
              ) : filteredLogs.length ===
                0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No audit logs match
                      your current filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/10 bg-white/[0.025]">
                        <tr>
                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            User
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Action
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Details
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Entity
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Date & Time
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredLogs.map(
                          (log) => (
                            <tr
                              key={log.id}
                              className="border-b border-white/5 transition hover:bg-white/[0.035] last:border-0"
                            >
                              {/* USER */}
                              <td className="px-6 py-5">
                                <p className="font-medium text-white">
                                  {log.user
                                    ?.full_name ??
                                    'Unknown user'}
                                </p>

                                <p className="mt-1 text-xs capitalize text-slate-500">
                                  {log.user
                                    ?.role ??
                                    'user'}
                                </p>
                              </td>

                              {/* ACTION */}
                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getActionStyles(
                                    log.action
                                  )}`}
                                >
                                  {getActionLabel(
                                    log.action
                                  )}
                                </span>
                              </td>

                              {/* DETAILS */}
                              <td className="max-w-[320px] px-6 py-5 text-sm text-slate-300">
                                {getDetailsText(
                                  log.details
                                )}
                              </td>

                              {/* ENTITY */}
                              <td className="px-6 py-5">
                                <p className="text-sm capitalize text-slate-300">
                                  {log.entity_type ??
                                    '—'}
                                </p>

                                {log.entity_id && (
                                  <p
                                    className="mt-1 max-w-[170px] truncate font-mono text-xs text-slate-600"
                                    title={
                                      log.entity_id
                                    }
                                  >
                                    {
                                      log.entity_id
                                    }
                                  </p>
                                )}
                              </td>

                              {/* DATE */}
                              <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-400">
                                {new Date(
                                  log.created_at
                                ).toLocaleString(
                                  'en-PH',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  }
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE / TABLET */}
                  <div className="grid gap-4 p-5 xl:hidden">
                    {filteredLogs.map(
                      (log) => (
                        <article
                          key={log.id}
                          className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/50 p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
                                {
                                  log.user
                                    ?.role ??
                                  'User'
                                }
                              </p>

                              <h3 className="mt-2 font-semibold">
                                {log.user
                                  ?.full_name ??
                                  'Unknown user'}
                              </h3>
                            </div>

                            <span
                              className={`self-start rounded-full border px-3 py-1.5 text-xs font-medium ${getActionStyles(
                                log.action
                              )}`}
                            >
                              {getActionLabel(
                                log.action
                              )}
                            </span>
                          </div>

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-slate-600">
                                Details
                              </p>

                              <p className="mt-1 text-sm text-slate-300">
                                {getDetailsText(
                                  log.details
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-600">
                                Entity
                              </p>

                              <p className="mt-1 text-sm capitalize text-slate-300">
                                {log.entity_type ??
                                  '—'}
                              </p>
                            </div>
                          </div>

                          {log.entity_id && (
                            <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                              <p className="text-xs text-slate-600">
                                Entity ID
                              </p>

                              <p className="mt-2 break-all font-mono text-xs text-slate-500">
                                {
                                  log.entity_id
                                }
                              </p>
                            </div>
                          )}

                          <div className="mt-5 border-t border-white/5 pt-4">
                            <p className="text-xs text-slate-500">
                              {new Date(
                                log.created_at
                              ).toLocaleString(
                                'en-PH',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                          </div>
                        </article>
                      )
                    )}
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