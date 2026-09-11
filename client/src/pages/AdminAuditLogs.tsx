import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

function AdminAuditLogs() {
  const navigate = useNavigate()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    const loadAuditLogs = async () => {
      setLoading(true)

      const { data, error } = await supabase
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error(
          'Failed to load audit logs:',
          error
        )

        setLoading(false)
        return
      }

      setLogs(
        (data as unknown as AuditLog[]) ?? []
      )

      setLoading(false)
    }

    loadAuditLogs()
  }, [])

  const filteredLogs = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    return logs.filter((log) => {
      const userName =
        log.user?.full_name?.toLowerCase() ?? ''

      const action =
        log.action.toLowerCase()

      const entityType =
        log.entity_type?.toLowerCase() ?? ''

      const matchesSearch =
        normalizedSearch === '' ||
        userName.includes(normalizedSearch) ||
        action.includes(normalizedSearch) ||
        entityType.includes(normalizedSearch)

      const matchesAction =
        actionFilter === 'all' ||
        log.action === actionFilter

      return matchesSearch && matchesAction
    })
  }, [
    logs,
    searchTerm,
    actionFilter,
  ])

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'booking_status_changed':
        return 'Booking status changed'

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

      default:
        return action
          .replaceAll('_', ' ')
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
          )
    }
  }

  const getActionStyles = (action: string) => {
    if (action.includes('payment')) {
      return 'bg-emerald-500/10 text-emerald-300'
    }

    if (action.includes('cancelled')) {
      return 'bg-red-500/10 text-red-300'
    }

    if (
      action.includes('staff_assigned') ||
      action.includes('staff_unassigned')
    ) {
      return 'bg-amber-500/10 text-amber-300'
    }

    return 'bg-indigo-500/10 text-indigo-300'
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
      )} → ${String(details.new_status)}`
    }

    if (
      details.service &&
      details.amount
    ) {
      return `${String(
        details.service
      )} • ₱${Number(
        details.amount
      ).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }

    if (details.service) {
      return String(details.service)
    }

    if (details.new_staff_name) {
      return String(details.new_staff_name)
    }

    if (details.previous_staff_name) {
      return String(details.previous_staff_name)
    }

    return '—'
  }

  const resetFilters = () => {
    setSearchTerm('')
    setActionFilter('all')
  }

  const hasActiveFilters =
    searchTerm !== '' ||
    actionFilter !== 'all'

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ChevronLeft size={18} />
          Back to dashboard
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
            <Activity size={24} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
              ServEase
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Audit Logs
            </h1>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              size={18}
              className="text-violet-300"
            />

            <h2 className="font-semibold">
              Search & Filters
            </h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search user, action, or entity"
                className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400"
            >
              <option value="all">
                All actions
              </option>

              <option value="booking_status_changed">
                Booking status changed
              </option>

              <option value="customer_cancelled_booking">
                Customer cancelled booking
              </option>

              <option value="staff_assigned_to_booking">
                Staff assigned
              </option>

              <option value="staff_unassigned_from_booking">
                Staff unassigned
              </option>

              <option value="payment_recorded">
                Payment recorded
              </option>

              <option value="payment_status_changed">
                Payment status changed
              </option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {filteredLogs.length} of {logs.length} logs
            </p>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                <X size={15} />
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {loading ? (
            <div className="p-8 text-slate-400">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-slate-400">
              No audit logs found.
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-slate-400">
              No audit logs match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      User
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Action
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Details
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Entity
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Date & Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">
                          {log.user?.full_name ?? 'Unknown user'}
                        </p>

                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {log.user?.role ?? 'user'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getActionStyles(
                            log.action
                          )}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-300">
                        {getDetailsText(log.details)}
                      </td>

                      <td className="px-6 py-4">
                        <p className="capitalize text-slate-300">
                          {log.entity_type ?? '—'}
                        </p>

                        {log.entity_id && (
                          <p className="mt-1 max-w-[150px] truncate text-xs text-slate-600">
                            {log.entity_id}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                        {new Date(
                          log.created_at
                        ).toLocaleString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
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

export default AdminAuditLogs