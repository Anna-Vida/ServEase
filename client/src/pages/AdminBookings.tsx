import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Booking = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
  customer: {
    full_name: string
  } | null
  service: {
    name: string
  } | null
}

function AdminBookings() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          customer:profiles!appointments_customer_id_fkey (
            full_name
          ),
          service:services (
            name
          )
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) {
        console.error('Failed to load bookings:', error)
      } else {
        setBookings((data as unknown as Booking[]) ?? [])
      }

      setLoading(false)
    }

    loadBookings()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
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
                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium capitalize text-indigo-300">
                          {booking.status}
                        </span>
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