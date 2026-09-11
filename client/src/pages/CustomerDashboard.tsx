import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  Plus,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'

type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'

type CustomerAppointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  notes: string | null
  staff_id: string | null

  service: {
    name: string
    price: number
  } | null

  staff_name: string | null
  payment_status: PaymentStatus | null
  payment_amount: number | null
}

type StaffProfile = {
  id: string
  full_name: string
}

type PaymentRecord = {
  appointment_id: string
  payment_status: PaymentStatus
  amount: number
}

function CustomerDashboard() {
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState<CustomerAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState('Customer')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    const loadCustomerDashboard = async () => {
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
        console.error(
          'Failed to load customer profile:',
          profileError
        )
      } else {
        setCustomerName(
          profileData.full_name || 'Customer'
        )
      }

      const { data: appointmentData, error: appointmentError } =
        await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            notes,
            staff_id,
            service:services (
              name,
              price
            )
          `)
          .eq('customer_id', user.id)
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false })

      if (appointmentError) {
        console.error(
          'Failed to load customer appointments:',
          appointmentError
        )

        setAppointments([])
        setLoading(false)
        return
      }

      const baseAppointments =
        (appointmentData as unknown as {
          id: string
          appointment_date: string
          appointment_time: string
          status: AppointmentStatus
          notes: string | null
          staff_id: string | null
          service: {
            name: string
            price: number
          } | null
        }[]) ?? []

      const staffIds = [
        ...new Set(
          baseAppointments
            .map((appointment) => appointment.staff_id)
            .filter(
              (staffId): staffId is string =>
                staffId !== null
            )
        ),
      ]

      let staffProfiles: StaffProfile[] = []

      if (staffIds.length > 0) {
        const { data: staffData, error: staffError } =
          await supabase
            .from('profiles')
            .select(`
              id,
              full_name
            `)
            .in('id', staffIds)

        if (staffError) {
          console.error(
            'Failed to load assigned staff:',
            staffError
          )
        } else {
          staffProfiles =
            (staffData as StaffProfile[]) ?? []
        }
      }

      const appointmentIds = baseAppointments.map(
        (appointment) => appointment.id
      )

      let payments: PaymentRecord[] = []

      if (appointmentIds.length > 0) {
        const { data: paymentData, error: paymentError } =
          await supabase
            .from('payments')
            .select(`
              appointment_id,
              payment_status,
              amount
            `)
            .in('appointment_id', appointmentIds)
            .order('created_at', { ascending: false })

        if (paymentError) {
          console.error(
            'Failed to load customer payments:',
            paymentError
          )
        } else {
          payments =
            (paymentData as PaymentRecord[]) ?? []
        }
      }

      const mergedAppointments: CustomerAppointment[] =
        baseAppointments.map((appointment) => {
          const assignedStaff = staffProfiles.find(
            (staff) =>
              staff.id === appointment.staff_id
          )

          const payment = payments.find(
            (paymentRecord) =>
              paymentRecord.appointment_id ===
              appointment.id
          )

          return {
            ...appointment,

            staff_name:
              assignedStaff?.full_name ?? null,

            payment_status:
              payment?.payment_status ?? null,

            payment_amount:
              payment?.amount ?? null,
          }
        })

      setAppointments(mergedAppointments)
      setLoading(false)
    }

    loadCustomerDashboard()
  }, [navigate])

  const upcomingAppointments = useMemo(() => {
    const today =
      new Date().toISOString().split('T')[0]

    return appointments.filter(
      (appointment) =>
        appointment.appointment_date >= today &&
        appointment.status !== 'completed' &&
        appointment.status !== 'cancelled'
    )
  }, [appointments])

  const completedAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        appointment.status === 'completed'
    )
  }, [appointments])

  const getStatusStyles = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case 'confirmed':
        return 'bg-cyan-500/10 text-cyan-300'

      case 'completed':
        return 'bg-emerald-500/10 text-emerald-300'

      case 'cancelled':
        return 'bg-red-500/10 text-red-300'

      default:
        return 'bg-indigo-500/10 text-indigo-300'
    }
  }

  const getPaymentStyles = (
    status: PaymentStatus
  ) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-300'

      case 'failed':
        return 'bg-red-500/10 text-red-300'

      case 'refunded':
        return 'bg-amber-500/10 text-amber-300'

      default:
        return 'bg-indigo-500/10 text-indigo-300'
    }
  }

  const handleCancelBooking = async (
    appointmentId: string
  ) => {
    const appointment = appointments.find(
      (currentAppointment) =>
        currentAppointment.id === appointmentId
    )

    if (!appointment) {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment?'
    )

    if (!confirmed) {
      return
    }

    setCancellingId(appointmentId)

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .eq('status', 'pending')

    if (error) {
      console.error(
        'Failed to cancel appointment:',
        error
      )

      setCancellingId(null)
      return
    }

    setAppointments((currentAppointments) =>
      currentAppointments.map((currentAppointment) =>
        currentAppointment.id === appointmentId
          ? {
              ...currentAppointment,
              status: 'cancelled',
            }
          : currentAppointment
      )
    )

    await logAudit({
      action: 'customer_cancelled_booking',
      entityType: 'appointment',
      entityId: appointmentId,
      details: {
        previous_status: 'pending',
        new_status: 'cancelled',
        service:
          appointment.service?.name ?? null,
        appointment_date:
          appointment.appointment_date,
        appointment_time:
          appointment.appointment_time,
      },
    })

    setCancellingId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
              ServEase
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              Customer Dashboard
            </h1>

            <p className="mt-3 text-slate-400">
              Welcome, {customerName}. Manage your
              appointments and services.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/book')}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <Plus size={18} />
              Book Appointment
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
                <CalendarDays size={20} />
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Total Bookings
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {loading
                    ? '...'
                    : appointments.length}
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
                  Upcoming
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {loading
                    ? '...'
                    : upcomingAppointments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Completed
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {loading
                    ? '...'
                    : completedAppointments.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-lg font-semibold">
              My Appointments
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Track your bookings, assigned staff, and
              payment status.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-slate-400">
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8">
              <p className="text-slate-400">
                You do not have any appointments yet.
              </p>

              <button
                onClick={() => navigate('/book')}
                className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Book your first appointment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Service
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Staff
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Date
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Time
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Price
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Booking Status
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Payment Status
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Notes
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map(
                    (appointment) => (
                      <tr
                        key={appointment.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          {appointment.service?.name ??
                            'Service'}
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {appointment.staff_name ??
                            'Unassigned'}
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {
                            appointment.appointment_date
                          }
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {appointment.appointment_time.slice(
                            0,
                            5
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          {appointment.service
                            ? `₱${Number(
                                appointment.service
                                  .price
                              ).toLocaleString(
                                'en-PH',
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}`
                            : '—'}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyles(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {appointment.payment_status ? (
                            <div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getPaymentStyles(
                                  appointment.payment_status
                                )}`}
                              >
                                {
                                  appointment.payment_status
                                }
                              </span>

                              {appointment.payment_amount !==
                                null && (
                                <p className="mt-2 text-xs text-slate-500">
                                  ₱
                                  {Number(
                                    appointment.payment_amount
                                  ).toLocaleString(
                                    'en-PH',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-400">
                              No payment
                            </span>
                          )}
                        </td>

                        <td className="max-w-xs px-6 py-4 text-slate-400">
                          {appointment.notes || '—'}
                        </td>

                        <td className="px-6 py-4">
                          {appointment.status ===
                          'pending' ? (
                            <button
                              onClick={() =>
                                handleCancelBooking(
                                  appointment.id
                                )
                              }
                              disabled={
                                cancellingId ===
                                appointment.id
                              }
                              className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <XCircle size={15} />

                              {cancellingId ===
                              appointment.id
                                ? 'Cancelling...'
                                : 'Cancel'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default CustomerDashboard