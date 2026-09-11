import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

  const handleStatusChange = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
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
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status: newStatus,
            }
          : booking
      )
    )

    setUpdatingId(null)
  }

  const handleStaffChange = async (
    bookingId: string,
    staffId: string
  ) => {
    setUpdatingId(bookingId)

    const newStaffId =
      staffId === '' ? null : staffId

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
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              staff_id: newStaffId,
            }
          : booking
      )
    )

    setUpdatingId(null)
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

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {loading ? (
            <div className="p-8 text-slate-400">
              Loading bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-slate-400">
              No bookings found.
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
                  {bookings.map((booking) => (
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