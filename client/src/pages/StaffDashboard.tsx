import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  LogOut,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

type StaffAppointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  notes: string | null
  customer: {
    full_name: string
  } | null
  service: {
    name: string
  } | null
}

function StaffDashboard() {
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState<StaffAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [staffName, setStaffName] = useState('Staff')

  useEffect(() => {
    const loadStaffDashboard = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Failed to load staff profile:', profileError)
      } else {
        setStaffName(profileData.full_name || 'Staff')
      }

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
        .eq('staff_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) {
        console.error('Failed to load assigned appointments:', error)
      } else {
        setAppointments(
          (data as unknown as StaffAppointment[]) ?? []
        )
      }

      setLoading(false)
    }

    loadStaffDashboard()
  }, [navigate])

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    setUpdatingId(appointmentId)

    const { error } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (error) {
      console.error('Failed to update appointment:', error)
      setUpdatingId(null)
      return
    }

    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === appointmentId
          ? {
              ...appointment,
              status: newStatus,
            }
          : appointment
      )
    )

    setUpdatingId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getStatusStyles = (status: AppointmentStatus) => {
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
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
              ServEase
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              Staff Dashboard
            </h1>

            <p className="mt-3 text-slate-400">
              Welcome, {staffName}. View your assigned appointments and update
              service status.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 self-start rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
                <CalendarDays size={20} />
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Assigned Appointments
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {loading ? '...' : appointments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                <Clock3 size={20} />
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Confirmed
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {loading
                    ? '...'
                    : appointments.filter(
                        (appointment) =>
                          appointment.status === 'confirmed'
                      ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
                <Wrench size={20} />
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Completed
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {loading
                    ? '...'
                    : appointments.filter(
                        (appointment) =>
                          appointment.status === 'completed'
                      ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-lg font-semibold">
              Assigned Appointments
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Appointments currently assigned to your staff account.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-slate-400">
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-slate-400">
              No appointments have been assigned to you yet.
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
                  {appointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
                            <UserRound size={17} />
                          </div>

                          <span className="font-medium">
                            {appointment.customer?.full_name ??
                              'Customer'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {appointment.service?.name ?? 'Service'}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {appointment.appointment_date}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {appointment.appointment_time.slice(0, 5)}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={appointment.status}
                          disabled={updatingId === appointment.id}
                          onChange={(event) =>
                            handleStatusChange(
                              appointment.id,
                              event.target.value as AppointmentStatus
                            )
                          }
                          className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyles(
                            appointment.status
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

                        {updatingId === appointment.id && (
                          <p className="mt-2 text-xs text-slate-500">
                            Updating...
                          </p>
                        )}
                      </td>

                      <td className="max-w-xs px-6 py-4 text-slate-400">
                        {appointment.notes || '—'}
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

export default StaffDashboard