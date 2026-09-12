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

  const [bookings, setBookings] =
    useState<Booking[]>([])

  const [staffMembers, setStaffMembers] =
    useState<StaffMember[]>([])

  const [loading, setLoading] =
    useState(true)

  const [updatingId, setUpdatingId] =
    useState<string | null>(null)

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [staffFilter, setStaffFilter] =
    useState('all')

  const [dateFilter, setDateFilter] =
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
    const loadData = async () => {
      setLoading(true)

      const [
        bookingsResult,
        staffResult,
      ] = await Promise.all([
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
          (bookingsResult.data as unknown as Booking[]) ??
            []
        )
      }

      if (staffResult.error) {
        console.error(
          'Failed to load staff:',
          staffResult.error
        )
      } else {
        setStaffMembers(
          (staffResult.data as unknown as StaffMember[]) ??
            []
        )
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const filteredBookings =
    useMemo(() => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase()

      return bookings.filter(
        (booking) => {
          const customerName =
            booking.customer?.full_name
              ?.toLowerCase() ?? ''

          const serviceName =
            booking.service?.name
              ?.toLowerCase() ?? ''

          const matchesSearch =
            normalizedSearch === '' ||
            customerName.includes(
              normalizedSearch
            ) ||
            serviceName.includes(
              normalizedSearch
            )

          const matchesStatus =
            statusFilter === 'all' ||
            booking.status ===
              statusFilter

          const matchesStaff =
            staffFilter === 'all' ||
            (staffFilter ===
            'unassigned'
              ? booking.staff_id ===
                null
              : booking.staff_id ===
                staffFilter)

          const matchesDate =
            dateFilter === '' ||
            booking.appointment_date ===
              dateFilter

          return (
            matchesSearch &&
            matchesStatus &&
            matchesStaff &&
            matchesDate
          )
        }
      )
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
      (currentBooking) =>
        currentBooking.id === bookingId
    )

    if (!booking) {
      return
    }

    const previousStatus =
      booking.status

    if (previousStatus === newStatus) {
      return
    }

    setUpdatingId(bookingId)

    const { error } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        updated_at:
          new Date().toISOString(),
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

    setBookings(
      (currentBookings) =>
        currentBookings.map(
          (currentBooking) =>
            currentBooking.id ===
            bookingId
              ? {
                  ...currentBooking,
                  status: newStatus,
                }
              : currentBooking
        )
    )

    await logAudit({
      action:
        'booking_status_changed',

      entityType:
        'appointment',

      entityId:
        bookingId,

      details: {
        previous_status:
          previousStatus,

        new_status:
          newStatus,

        customer:
          booking.customer
            ?.full_name ?? null,

        service:
          booking.service?.name ??
          null,
      },
    })

    setUpdatingId(null)
  }

  const handleStaffChange = async (
    bookingId: string,
    staffId: string
  ) => {
    const booking = bookings.find(
      (currentBooking) =>
        currentBooking.id === bookingId
    )

    if (!booking) {
      return
    }

    const previousStaffId =
      booking.staff_id

    const newStaffId =
      staffId === ''
        ? null
        : staffId

    if (
      previousStaffId === newStaffId
    ) {
      return
    }

    setUpdatingId(bookingId)

    const { error } = await supabase
      .from('appointments')
      .update({
        staff_id: newStaffId,
        updated_at:
          new Date().toISOString(),
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

    setBookings(
      (currentBookings) =>
        currentBookings.map(
          (currentBooking) =>
            currentBooking.id ===
            bookingId
              ? {
                  ...currentBooking,
                  staff_id:
                    newStaffId,
                }
              : currentBooking
        )
    )

    const previousStaff =
      staffMembers.find(
        (staff) =>
          staff.id ===
          previousStaffId
      )

    const newStaff =
      staffMembers.find(
        (staff) =>
          staff.id ===
          newStaffId
      )

    await logAudit({
      action: newStaffId
        ? 'staff_assigned_to_booking'
        : 'staff_unassigned_from_booking',

      entityType:
        'appointment',

      entityId:
        bookingId,

      details: {
        previous_staff_id:
          previousStaffId,

        previous_staff_name:
          previousStaff?.profile
            ?.full_name ?? null,

        new_staff_id:
          newStaffId,

        new_staff_name:
          newStaff?.profile
            ?.full_name ?? null,

        customer:
          booking.customer
            ?.full_name ?? null,

        service:
          booking.service?.name ??
          null,
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
        return 'border-[#cfe1f5] bg-[#eaf3ff] text-[#3569a6]'

      case 'completed':
        return 'border-[#bfe7d6] bg-[#e9f8f1] text-[#16845b]'

      case 'cancelled':
        return 'border-[#f3c7bb] bg-[#fff0ec] text-[#c9472d]'

      default:
        return 'border-[#f4dda5] bg-[#fff3d7] text-[#b26a00]'
    }
  }

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

  const getStaffName = (
    staffId: string | null
  ) => {
    if (!staffId) {
      return 'Unassigned'
    }

    return (
      staffMembers.find(
        (staff) =>
          staff.id === staffId
      )?.profile?.full_name ??
      'Staff member'
    )
  }

  const formatDate = (
    value: string
  ) => {
    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    )
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
    <nav className="mt-8 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon

        const active =
          item.path ===
          '/admin/bookings'

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
              <p className="text-sm font-bold text-[#ff6b4a]">
                Booking management
              </p>

              <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                Manage{' '}
                <span className="se-gradient-text">
                  Bookings
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74675f] sm:text-base">
                Search appointments, assign staff,
                update booking status, and manage
                ServEase appointment activity.
              </p>
            </header>

            {/* FILTERS */}
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
                    Filter your booking records.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                    placeholder="Search customer or service"
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

                  <option value="pending">
                    Pending
                  </option>

                  <option value="confirmed">
                    Confirmed
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="cancelled">
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
                  className="se-input h-11 text-sm"
                >
                  <option value="all">
                    All staff
                  </option>

                  <option value="unassigned">
                    Unassigned
                  </option>

                  {staffMembers.map(
                    (staff) => (
                      <option
                        key={staff.id}
                        value={staff.id}
                      >
                        {staff.profile
                          ?.full_name ??
                          'Staff member'}
                      </option>
                    )
                  )}
                </select>

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) =>
                    setDateFilter(
                      event.target.value
                    )
                  }
                  className="se-input h-11 text-sm"
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#8b7c73]">
                  Showing{' '}
                  <span className="font-semibold text-[#1c1410]">
                    {filteredBookings.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-[#1c1410]">
                    {bookings.length}
                  </span>{' '}
                  bookings
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

            {/* BOOKINGS */}
            <section className="pt-10">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                  Appointment records
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  Booking Activity
                </h2>

                <p className="mt-2 text-sm text-[#74675f]">
                  Manage staff assignments and booking
                  statuses from one place.
                </p>
              </div>

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                    <p className="mt-4 text-sm text-[#8b7c73]">
                      Loading bookings...
                    </p>
                  </div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white text-sm text-[#8b7c73]">
                  No bookings found.
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-[#b6a79d]"
                    />

                    <p className="mt-4 text-sm text-[#8b7c73]">
                      No bookings match your current filters.
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
                              Customer
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Service
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Schedule
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Assigned Staff
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Status
                            </th>

                            <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                              Notes
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#f1e4db]">
                          {filteredBookings.map(
                            (booking) => {
                              const customerName =
                                booking.customer
                                  ?.full_name ??
                                'Customer'

                              return (
                                <tr
                                  key={booking.id}
                                  className="group transition-colors hover:bg-[#fffaf6]"
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

                                  {/* SERVICE */}
                                  <td className="px-5 py-4">
                                    <p className="font-medium text-[#493c35]">
                                      {booking
                                        .service
                                        ?.name ??
                                        'Service'}
                                    </p>
                                  </td>

                                  {/* SCHEDULE */}
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <p className="font-medium text-[#493c35]">
                                      {formatDate(
                                        booking.appointment_date
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs text-[#9a8a80]">
                                      {booking.appointment_time.slice(
                                        0,
                                        5
                                      )}
                                    </p>
                                  </td>

                                  {/* STAFF */}
                                  <td className="px-5 py-4">
                                    <select
                                      value={
                                        booking.staff_id ??
                                        ''
                                      }
                                      disabled={
                                        updatingId ===
                                        booking.id
                                      }
                                      onChange={(event) =>
                                        handleStaffChange(
                                          booking.id,
                                          event.target.value
                                        )
                                      }
                                      className="min-w-[165px] rounded-lg border border-[#e6d7cc] bg-white px-3 py-2 text-xs font-medium text-[#493c35] outline-none transition hover:border-[#d9c0b0] focus:border-[#ff9a76] focus:ring-2 focus:ring-[#ff6b4a]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <option value="">
                                        Unassigned
                                      </option>

                                      {staffMembers.map(
                                        (
                                          staff
                                        ) => (
                                          <option
                                            key={
                                              staff.id
                                            }
                                            value={
                                              staff.id
                                            }
                                          >
                                            {staff.profile
                                              ?.full_name ??
                                              'Staff member'}
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </td>

                                  {/* STATUS */}
                                  <td className="px-5 py-4">
                                    <select
                                      value={
                                        booking.status
                                      }
                                      disabled={
                                        updatingId ===
                                        booking.id
                                      }
                                      onChange={(event) =>
                                        handleStatusChange(
                                          booking.id,
                                          event.target
                                            .value as BookingStatus
                                        )
                                      }
                                      className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyles(
                                        booking.status
                                      )}`}
                                    >
                                      <option value="pending">
                                        Pending
                                      </option>

                                      <option value="confirmed">
                                        Confirmed
                                      </option>

                                      <option value="completed">
                                        Completed
                                      </option>

                                      <option value="cancelled">
                                        Cancelled
                                      </option>
                                    </select>

                                    {updatingId ===
                                      booking.id && (
                                      <p className="mt-1.5 text-[11px] text-[#9a8a80]">
                                        Updating...
                                      </p>
                                    )}
                                  </td>

                                  {/* NOTES */}
                                  <td className="max-w-[250px] px-5 py-4">
                                    <p
                                      className="truncate text-sm text-[#74675f]"
                                      title={
                                        booking.notes ??
                                        ''
                                      }
                                    >
                                      {booking.notes ||
                                        '—'}
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
                      {filteredBookings.map(
                        (booking) => {
                          const customerName =
                            booking.customer
                              ?.full_name ??
                            'Customer'

                          return (
                            <article
                              key={booking.id}
                              className="p-5 sm:p-6"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
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

                                    <p className="mt-1 truncate text-sm text-[#74675f]">
                                      {booking
                                        .service
                                        ?.name ??
                                        'Service'}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyles(
                                    booking.status
                                  )}`}
                                >
                                  {
                                    booking.status
                                  }
                                </span>
                              </div>

                              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f1e4db] pt-4">
                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Date
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-[#493c35]">
                                    {formatDate(
                                      booking.appointment_date
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Time
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-[#493c35]">
                                    {booking.appointment_time.slice(
                                      0,
                                      5
                                    )}
                                  </p>
                                </div>

                                <div className="col-span-2">
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Assigned staff
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-[#493c35]">
                                    {getStaffName(
                                      booking.staff_id
                                    )}
                                  </p>
                                </div>
                              </div>

                              {booking.notes && (
                                <div className="mt-4 rounded-xl bg-[#fffaf6] px-4 py-3">
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Notes
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-[#65574f]">
                                    {
                                      booking.notes
                                    }
                                  </p>
                                </div>
                              )}

                              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="mb-2 block text-xs font-semibold text-[#74675f]">
                                    Assigned Staff
                                  </label>

                                  <select
                                    value={
                                      booking.staff_id ??
                                      ''
                                    }
                                    disabled={
                                      updatingId ===
                                      booking.id
                                    }
                                    onChange={(event) =>
                                      handleStaffChange(
                                        booking.id,
                                        event.target.value
                                      )
                                    }
                                    className="se-input w-full py-3 text-sm"
                                  >
                                    <option value="">
                                      Unassigned
                                    </option>

                                    {staffMembers.map(
                                      (
                                        staff
                                      ) => (
                                        <option
                                          key={
                                            staff.id
                                          }
                                          value={
                                            staff.id
                                          }
                                        >
                                          {staff.profile
                                            ?.full_name ??
                                            'Staff member'}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-2 block text-xs font-semibold text-[#74675f]">
                                    Booking Status
                                  </label>

                                  <select
                                    value={
                                      booking.status
                                    }
                                    disabled={
                                      updatingId ===
                                      booking.id
                                    }
                                    onChange={(event) =>
                                      handleStatusChange(
                                        booking.id,
                                        event.target
                                          .value as BookingStatus
                                      )
                                    }
                                    className={`w-full rounded-xl border px-4 py-3 text-sm font-bold capitalize outline-none ${getStatusStyles(
                                      booking.status
                                    )}`}
                                  >
                                    <option value="pending">
                                      Pending
                                    </option>

                                    <option value="confirmed">
                                      Confirmed
                                    </option>

                                    <option value="completed">
                                      Completed
                                    </option>

                                    <option value="cancelled">
                                      Cancelled
                                    </option>
                                  </select>
                                </div>
                              </div>

                              {updatingId ===
                                booking.id && (
                                <p className="mt-3 text-xs text-[#8b7c73]">
                                  Updating booking...
                                </p>
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

export default AdminBookings