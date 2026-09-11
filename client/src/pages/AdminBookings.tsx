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
import { logAudit } from '../lib/audit'

type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

type Booking = {
  id: string
  appointment_date: string
  appointment_time: string
  status: BookingStatus
  notes: string | null
  staff_id: string | null

  customer: {
    full_name: string
  } | null

  service: {
    name: string
  } | null
}

type StaffMember = {
  id: string

  profile: {
    full_name: string
  } | null
}

type NavItem = {
  label: string
  path: string
  icon: React.ElementType
}

function AdminBookings() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

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
    const loadData = async () => {
      setLoading(true)

      const [bookingsResult, staffResult] = await Promise.all([
        supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            notes,
            staff_id,
            customer:profiles!appointments_customer_id_fkey (
              full_name
            ),
            service:services (
              name
            )
          `)
          .order('appointment_date', {
            ascending: true,
          })
          .order('appointment_time', {
            ascending: true,
          }),

        supabase
          .from('staff_profiles')
          .select(`
            id,
            profile:profiles (
              full_name
            )
          `)
          .eq('is_active', true)
          .order('created_at', {
            ascending: false,
          }),
      ])

      if (bookingsResult.error) {
        console.error(
          'Failed to load bookings:',
          bookingsResult.error
        )
      } else {
        setBookings(
          (bookingsResult.data as unknown as Booking[]) ?? []
        )
      }

      if (staffResult.error) {
        console.error(
          'Failed to load staff:',
          staffResult.error
        )
      } else {
        setStaffMembers(
          (staffResult.data as unknown as StaffMember[]) ?? []
        )
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return bookings.filter((booking) => {
      const customerName =
        booking.customer?.full_name?.toLowerCase() ?? ''

      const serviceName =
        booking.service?.name?.toLowerCase() ?? ''

      const matchesSearch =
        normalizedSearch === '' ||
        customerName.includes(normalizedSearch) ||
        serviceName.includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'all' ||
        booking.status === statusFilter

      const matchesStaff =
        staffFilter === 'all' ||
        (staffFilter === 'unassigned'
          ? booking.staff_id === null
          : booking.staff_id === staffFilter)

      const matchesDate =
        dateFilter === '' ||
        booking.appointment_date === dateFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStaff &&
        matchesDate
      )
    })
  }, [
    bookings,
    searchTerm,
    statusFilter,
    staffFilter,
    dateFilter,
  ])

  const handleStatusChange = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
    const booking = bookings.find(
      (currentBooking) => currentBooking.id === bookingId
    )

    if (!booking) {
      return
    }

    const previousStatus = booking.status

    if (previousStatus === newStatus) {
      return
    }

    setUpdatingId(bookingId)

    const { error } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (error) {
      console.error(
        'Failed to update booking status:',
        error
      )

      setUpdatingId(null)
      return
    }

    setBookings((currentBookings) =>
      currentBookings.map((currentBooking) =>
        currentBooking.id === bookingId
          ? {
              ...currentBooking,
              status: newStatus,
            }
          : currentBooking
      )
    )

    await logAudit({
      action: 'booking_status_changed',
      entityType: 'appointment',
      entityId: bookingId,
      details: {
        previous_status: previousStatus,
        new_status: newStatus,
        customer: booking.customer?.full_name ?? null,
        service: booking.service?.name ?? null,
      },
    })

    setUpdatingId(null)
  }

  const handleStaffChange = async (
    bookingId: string,
    staffId: string
  ) => {
    const booking = bookings.find(
      (currentBooking) => currentBooking.id === bookingId
    )

    if (!booking) {
      return
    }

    const previousStaffId = booking.staff_id

    const newStaffId =
      staffId === ''
        ? null
        : staffId

    if (previousStaffId === newStaffId) {
      return
    }

    setUpdatingId(bookingId)

    const { error } = await supabase
      .from('appointments')
      .update({
        staff_id: newStaffId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (error) {
      console.error(
        'Failed to assign staff:',
        error
      )

      setUpdatingId(null)
      return
    }

    setBookings((currentBookings) =>
      currentBookings.map((currentBooking) =>
        currentBooking.id === bookingId
          ? {
              ...currentBooking,
              staff_id: newStaffId,
            }
          : currentBooking
      )
    )

    const previousStaff = staffMembers.find(
      (staff) => staff.id === previousStaffId
    )

    const newStaff = staffMembers.find(
      (staff) => staff.id === newStaffId
    )

    await logAudit({
      action: newStaffId
        ? 'staff_assigned_to_booking'
        : 'staff_unassigned_from_booking',

      entityType: 'appointment',
      entityId: bookingId,

      details: {
        previous_staff_id: previousStaffId,
        previous_staff_name:
          previousStaff?.profile?.full_name ?? null,

        new_staff_id: newStaffId,
        new_staff_name:
          newStaff?.profile?.full_name ?? null,

        customer:
          booking.customer?.full_name ?? null,

        service:
          booking.service?.name ?? null,
      },
    })

    setUpdatingId(null)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setStaffFilter('all')
    setDateFilter('')
  }

  const getStatusStyles = (
    status: BookingStatus
  ) => {
    switch (status) {
      case 'confirmed':
        return 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'

      case 'completed':
        return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'

      case 'cancelled':
        return 'border-rose-400/20 bg-rose-400/10 text-rose-300'

      default:
        return 'border-indigo-400/20 bg-indigo-400/10 text-indigo-300'
    }
  }

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    staffFilter !== 'all' ||
    dateFilter !== ''

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
          item.path === '/admin/bookings'

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
                ? 'flex w-full items-center gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-left text-indigo-200 shadow-[0_0_24px_rgba(99,102,241,0.08)]'
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

        {/* MOBILE MENU */}
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
            {/* PAGE HEADER */}
            <header className="se-glass rounded-[28px] px-6 py-6 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="se-icon-box h-14 w-14 rounded-2xl text-indigo-300">
                  <CalendarDays size={25} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
                    Booking Management
                  </p>

                  <h1 className="se-gradient-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    Bookings
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Search appointments,
                    assign staff, update
                    booking status, and manage
                    ServEase appointment activity.
                  </p>
                </div>
              </div>
            </header>

            {/* COMBINED BOOKINGS PANEL */}
            <section className="se-glass mt-7 overflow-hidden rounded-[28px]">
              {/* FILTER HEADER */}
              <div className="border-b border-white/10 px-6 py-6">
                <div className="flex items-center gap-3">
                  <div className="se-icon-box h-10 w-10 rounded-xl text-violet-300">
                    <SlidersHorizontal size={18} />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Search & Filters
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Filter real ServEase appointment records.
                    </p>
                  </div>
                </div>

                {/* FILTERS */}
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                      placeholder="Search customer or service"
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
                      value="pending"
                      className="bg-slate-900"
                    >
                      Pending
                    </option>

                    <option
                      value="confirmed"
                      className="bg-slate-900"
                    >
                      Confirmed
                    </option>

                    <option
                      value="completed"
                      className="bg-slate-900"
                    >
                      Completed
                    </option>

                    <option
                      value="cancelled"
                      className="bg-slate-900"
                    >
                      Cancelled
                    </option>
                  </select>

                  <select
                    value={staffFilter}
                    onChange={(event) =>
                      setStaffFilter(
                        event.target.value
                      )
                    }
                    className="se-input rounded-2xl px-4 py-3.5 text-sm"
                  >
                    <option
                      value="all"
                      className="bg-slate-900"
                    >
                      All staff
                    </option>

                    <option
                      value="unassigned"
                      className="bg-slate-900"
                    >
                      Unassigned
                    </option>

                    {staffMembers.map((staff) => (
                      <option
                        key={staff.id}
                        value={staff.id}
                        className="bg-slate-900"
                      >
                        {staff.profile?.full_name ??
                          'Staff member'}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) =>
                      setDateFilter(
                        event.target.value
                      )
                    }
                    className="se-input rounded-2xl px-4 py-3.5 text-sm"
                  />
                </div>

                {/* FILTER SUMMARY */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Showing{' '}
                    <span className="font-semibold text-white">
                      {filteredBookings.length}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-white">
                      {bookings.length}
                    </span>{' '}
                    bookings
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

              {/* TABLE TITLE */}
              <div className="border-b border-white/10 bg-white/[0.015] px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
                  Appointment Records
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Manage Bookings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Staff assignments and status changes are
                  saved to Supabase and recorded in the
                  ServEase audit log.
                </p>
              </div>

              {/* DATA */}
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-300" />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading bookings...
                    </p>
                  </div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">
                  No bookings found.
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No bookings match your current filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP */}
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/10 bg-white/[0.025]">
                        <tr>
                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Customer
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Service
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Schedule
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Staff
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Status
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Notes
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.035] last:border-0"
                          >
                            <td className="px-6 py-5 font-medium text-white">
                              {booking.customer?.full_name ??
                                'Customer'}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-300">
                              {booking.service?.name ??
                                'Service'}
                            </td>

                            <td className="whitespace-nowrap px-6 py-5">
                              <p className="text-sm text-slate-300">
                                {booking.appointment_date}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {booking.appointment_time.slice(
                                  0,
                                  5
                                )}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <select
                                value={booking.staff_id ?? ''}
                                disabled={
                                  updatingId === booking.id
                                }
                                onChange={(event) =>
                                  handleStaffChange(
                                    booking.id,
                                    event.target.value
                                  )
                                }
                                className="se-input min-w-[160px] rounded-xl px-3 py-2 text-xs"
                              >
                                <option
                                  value=""
                                  className="bg-slate-900"
                                >
                                  Unassigned
                                </option>

                                {staffMembers.map((staff) => (
                                  <option
                                    key={staff.id}
                                    value={staff.id}
                                    className="bg-slate-900"
                                  >
                                    {staff.profile?.full_name ??
                                      'Staff member'}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-6 py-5">
                              <select
                                value={booking.status}
                                disabled={
                                  updatingId === booking.id
                                }
                                onChange={(event) =>
                                  handleStatusChange(
                                    booking.id,
                                    event.target
                                      .value as BookingStatus
                                  )
                                }
                                className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyles(
                                  booking.status
                                )}`}
                              >
                                <option
                                  value="pending"
                                  className="bg-slate-900 text-white"
                                >
                                  Pending
                                </option>

                                <option
                                  value="confirmed"
                                  className="bg-slate-900 text-white"
                                >
                                  Confirmed
                                </option>

                                <option
                                  value="completed"
                                  className="bg-slate-900 text-white"
                                >
                                  Completed
                                </option>

                                <option
                                  value="cancelled"
                                  className="bg-slate-900 text-white"
                                >
                                  Cancelled
                                </option>
                              </select>

                              {updatingId === booking.id && (
                                <p className="mt-2 text-xs text-slate-500">
                                  Updating...
                                </p>
                              )}
                            </td>

                            <td className="max-w-[260px] px-6 py-5 text-sm text-slate-500">
                              {booking.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE / TABLET */}
                  <div className="grid gap-4 p-5 xl:hidden">
                    {filteredBookings.map((booking) => (
                      <article
                        key={booking.id}
                        className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/50 p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-indigo-300">
                              Customer
                            </p>

                            <h3 className="mt-2 text-lg font-semibold">
                              {booking.customer?.full_name ??
                                'Customer'}
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                              {booking.service?.name ??
                                'Service'}
                            </p>
                          </div>

                          <span
                            className={`self-start rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${getStatusStyles(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-slate-600">
                              Date
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {booking.appointment_date}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-600">
                              Time
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {booking.appointment_time.slice(
                                0,
                                5
                              )}
                            </p>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                            <p className="text-xs text-slate-600">
                              Notes
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {booking.notes}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs text-slate-500">
                              Assigned Staff
                            </label>

                            <select
                              value={booking.staff_id ?? ''}
                              disabled={
                                updatingId === booking.id
                              }
                              onChange={(event) =>
                                handleStaffChange(
                                  booking.id,
                                  event.target.value
                                )
                              }
                              className="se-input w-full rounded-2xl px-4 py-3 text-sm"
                            >
                              <option
                                value=""
                                className="bg-slate-900"
                              >
                                Unassigned
                              </option>

                              {staffMembers.map((staff) => (
                                <option
                                  key={staff.id}
                                  value={staff.id}
                                  className="bg-slate-900"
                                >
                                  {staff.profile?.full_name ??
                                    'Staff member'}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs text-slate-500">
                              Booking Status
                            </label>

                            <select
                              value={booking.status}
                              disabled={
                                updatingId === booking.id
                              }
                              onChange={(event) =>
                                handleStatusChange(
                                  booking.id,
                                  event.target
                                    .value as BookingStatus
                                )
                              }
                              className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium capitalize outline-none ${getStatusStyles(
                                booking.status
                              )}`}
                            >
                              <option
                                value="pending"
                                className="bg-slate-900 text-white"
                              >
                                Pending
                              </option>

                              <option
                                value="confirmed"
                                className="bg-slate-900 text-white"
                              >
                                Confirmed
                              </option>

                              <option
                                value="completed"
                                className="bg-slate-900 text-white"
                              >
                                Completed
                              </option>

                              <option
                                value="cancelled"
                                className="bg-slate-900 text-white"
                              >
                                Cancelled
                              </option>
                            </select>
                          </div>
                        </div>

                        {updatingId === booking.id && (
                          <p className="mt-4 text-xs text-slate-500">
                            Updating booking...
                          </p>
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

export default AdminBookings