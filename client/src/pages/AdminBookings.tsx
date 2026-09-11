import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

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
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true }),

        supabase
          .from('staff_profiles')
          .select(`
            id,
            profile:profiles (
              full_name
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
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
        customer:
          booking.customer?.full_name ?? null,
        service:
          booking.service?.name ?? null,
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
      staffId === '' ? null : staffId

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

  const getStatusStyles = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'

      case 'completed':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'

      case 'cancelled':
        return 'border-red-500/20 bg-red-500/10 text-red-300'

      default:
        return 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300'
    }
  }

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    staffFilter !== 'all' ||
    dateFilter !== ''

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
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
            <CalendarDays size={24} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
              ServEase
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Bookings
            </h1>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              size={18}
              className="text-indigo-300"
            />

            <h2 className="font-semibold">
              Search & Filters
            </h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                placeholder="Search customer or service"
                className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400"
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
                setStaffFilter(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400"
            >
              <option value="all">
                All staff
              </option>

              <option value="unassigned">
                Unassigned
              </option>

              {staffMembers.map((staff) => (
                <option
                  key={staff.id}
                  value={staff.id}
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
                setDateFilter(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {filteredBookings.length} of {bookings.length} bookings
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
              Loading bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-slate-400">
              No bookings found.
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-slate-400">
              No bookings match your current filters.
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
                      Service
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Date
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Time
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Staff
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-6 py-4">
                        {booking.customer?.full_name ?? 'Customer'}
                      </td>

                      <td className="px-6 py-4">
                        {booking.service?.name ?? 'Service'}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {booking.appointment_date}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {booking.appointment_time.slice(0, 5)}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={booking.staff_id ?? ''}
                          disabled={updatingId === booking.id}
                          onChange={(event) =>
                            handleStaffChange(
                              booking.id,
                              event.target.value
                            )
                          }
                          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            Unassigned
                          </option>

                          {staffMembers.map((staff) => (
                            <option
                              key={staff.id}
                              value={staff.id}
                            >
                              {staff.profile?.full_name ??
                                'Staff member'}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={booking.status}
                          disabled={updatingId === booking.id}
                          onChange={(event) =>
                            handleStatusChange(
                              booking.id,
                              event.target.value as BookingStatus
                            )
                          }
                          className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyles(
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

                      <td className="max-w-xs px-6 py-4 text-slate-400">
                        {booking.notes || '—'}
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

export default AdminBookings