import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  LogOut,
  Plus,
  Sparkles,
  UserRound,
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

  const [appointments, setAppointments] =
    useState<CustomerAppointment[]>([])

  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] =
    useState('Customer')

  const [cancellingId, setCancellingId] =
    useState<string | null>(null)

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

      /*
       * CUSTOMER PROFILE
       */
      const {
        data: profileData,
        error: profileError,
      } = await supabase
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

      /*
       * CUSTOMER APPOINTMENTS
       */
      const {
        data: appointmentData,
        error: appointmentError,
      } = await supabase
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
        .order('appointment_date', {
          ascending: false,
        })
        .order('appointment_time', {
          ascending: false,
        })

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

      /*
       * ASSIGNED STAFF
       */
      const staffIds = [
        ...new Set(
          baseAppointments
            .map(
              (appointment) =>
                appointment.staff_id
            )
            .filter(
              (staffId): staffId is string =>
                staffId !== null
            )
        ),
      ]

      let staffProfiles: StaffProfile[] = []

      if (staffIds.length > 0) {
        const {
          data: staffData,
          error: staffError,
        } = await supabase
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

      /*
       * PAYMENTS
       */
      const appointmentIds =
        baseAppointments.map(
          (appointment) => appointment.id
        )

      let payments: PaymentRecord[] = []

      if (appointmentIds.length > 0) {
        const {
          data: paymentData,
          error: paymentError,
        } = await supabase
          .from('payments')
          .select(`
            appointment_id,
            payment_status,
            amount
          `)
          .in(
            'appointment_id',
            appointmentIds
          )
          .order('created_at', {
            ascending: false,
          })

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

      /*
       * MERGE DATA
       */
      const mergedAppointments: CustomerAppointment[] =
        baseAppointments.map(
          (appointment) => {
            const assignedStaff =
              staffProfiles.find(
                (staff) =>
                  staff.id ===
                  appointment.staff_id
              )

            const payment =
              payments.find(
                (paymentRecord) =>
                  paymentRecord.appointment_id ===
                  appointment.id
              )

            return {
              ...appointment,

              staff_name:
                assignedStaff?.full_name ??
                null,

              payment_status:
                payment?.payment_status ??
                null,

              payment_amount:
                payment?.amount ?? null,
            }
          }
        )

      setAppointments(
        mergedAppointments
      )

      setLoading(false)
    }

    loadCustomerDashboard()
  }, [navigate])

  /*
   * LIVE DASHBOARD STATS
   */
  const upcomingAppointments = useMemo(() => {
    const today =
      new Date()
        .toISOString()
        .split('T')[0]

    return appointments.filter(
      (appointment) =>
        appointment.appointment_date >=
          today &&
        appointment.status !==
          'completed' &&
        appointment.status !==
          'cancelled'
    )
  }, [appointments])

  const completedAppointments =
    useMemo(() => {
      return appointments.filter(
        (appointment) =>
          appointment.status ===
          'completed'
      )
    }, [appointments])

  const paidAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        appointment.payment_status ===
        'paid'
    )
  }, [appointments])

  /*
   * STATUS STYLING
   */
  const getStatusStyles = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case 'confirmed':
        return 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.08)]'

      case 'completed':
        return 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.08)]'

      case 'cancelled':
        return 'border border-rose-400/20 bg-rose-400/10 text-rose-300'

      default:
        return 'border border-indigo-400/20 bg-indigo-400/10 text-indigo-300 shadow-[0_0_18px_rgba(99,102,241,0.08)]'
    }
  }

  const getPaymentStyles = (
    status: PaymentStatus
  ) => {
    switch (status) {
      case 'paid':
        return 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'

      case 'failed':
        return 'border border-red-400/20 bg-red-400/10 text-red-300'

      case 'refunded':
        return 'border border-amber-400/20 bg-amber-400/10 text-amber-300'

      default:
        return 'border border-indigo-400/20 bg-indigo-400/10 text-indigo-300'
    }
  }

  /*
   * CUSTOMER CANCELLATION
   */
  const handleCancelBooking = async (
    appointmentId: string
  ) => {
    const appointment =
      appointments.find(
        (currentAppointment) =>
          currentAppointment.id ===
          appointmentId
      )

    if (!appointment) {
      return
    }

    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this appointment?'
      )

    if (!confirmed) {
      return
    }

    setCancellingId(
      appointmentId
    )

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at:
          new Date().toISOString(),
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

    setAppointments(
      (currentAppointments) =>
        currentAppointments.map(
          (currentAppointment) =>
            currentAppointment.id ===
            appointmentId
              ? {
                  ...currentAppointment,
                  status: 'cancelled',
                }
              : currentAppointment
        )
    )

    await logAudit({
      action:
        'customer_cancelled_booking',

      entityType:
        'appointment',

      entityId:
        appointmentId,

      details: {
        previous_status:
          'pending',

        new_status:
          'cancelled',

        service:
          appointment.service?.name ??
          null,

        appointment_date:
          appointment.appointment_date,

        appointment_time:
          appointment.appointment_time,
      },
    })

    setCancellingId(null)
  }

  /*
   * LOGOUT
   */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <main className="se-page se-grid-bg relative min-h-screen overflow-hidden text-white">
      {/* BACKGROUND GLOWS */}
      <div className="se-orb se-orb-indigo -left-28 top-10" />
      <div className="se-orb se-orb-cyan -right-24 top-40" />
      <div className="se-orb se-orb-violet bottom-[-100px] left-[40%]" />

      <div className="relative z-10 mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        {/* HEADER */}
        <header className="se-glass rounded-[28px] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="se-icon-box h-14 w-14 rounded-2xl text-indigo-300">
                <Sparkles size={25} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">
                  ServEase
                </p>

                <h1 className="se-gradient-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Customer Dashboard
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                  Welcome, {customerName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  navigate('/book')
                }
                className="se-btn-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                <Plus size={18} />
                Book Appointment
              </button>

              <button
                onClick={handleLogout}
                className="se-btn-secondary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-red-300 hover:text-red-200"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* LIVE STATS */}
        <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* TOTAL BOOKINGS */}
          <div className="se-glass se-card-3d rounded-[24px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Total Bookings
                </p>

                <p className="mt-3 text-4xl font-bold">
                  {loading
                    ? '...'
                    : appointments.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  All your appointments
                </p>
              </div>

              <div className="se-icon-box h-12 w-12 rounded-2xl text-indigo-300">
                <CalendarDays
                  size={21}
                />
              </div>
            </div>
          </div>

          {/* UPCOMING */}
          <div className="se-glass se-card-3d rounded-[24px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Upcoming
                </p>

                <p className="mt-3 text-4xl font-bold">
                  {loading
                    ? '...'
                    : upcomingAppointments.length}
                </p>

                <p className="mt-2 text-xs text-cyan-400">
                  Active future appointments
                </p>
              </div>

              <div className="se-icon-box h-12 w-12 rounded-2xl text-cyan-300">
                <Clock3 size={21} />
              </div>
            </div>
          </div>

          {/* COMPLETED */}
          <div className="se-glass se-card-3d rounded-[24px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Completed
                </p>

                <p className="mt-3 text-4xl font-bold">
                  {loading
                    ? '...'
                    : completedAppointments.length}
                </p>

                <p className="mt-2 text-xs text-emerald-400">
                  Finished appointments
                </p>
              </div>

              <div className="se-icon-box h-12 w-12 rounded-2xl text-emerald-300">
                <CheckCircle2
                  size={21}
                />
              </div>
            </div>
          </div>

          {/* PAID */}
          <div className="se-glass se-card-3d rounded-[24px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Paid
                </p>

                <p className="mt-3 text-4xl font-bold">
                  {loading
                    ? '...'
                    : paidAppointments.length}
                </p>

                <p className="mt-2 text-xs text-violet-400">
                  Paid appointment records
                </p>
              </div>

              <div className="se-icon-box h-12 w-12 rounded-2xl text-violet-300">
                <CreditCard size={21} />
              </div>
            </div>
          </div>
        </section>

        {/* APPOINTMENTS */}
        <section className="se-glass mt-7 overflow-hidden rounded-[28px]">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
                Appointment Activity
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                My Appointments
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Track your service, assigned staff,
                booking status, and payment status.
              </p>
            </div>

            <div className="se-badge rounded-full px-4 py-2 text-xs">
              <UserRound size={14} />
              {appointments.length}{' '}
              {appointments.length === 1
                ? 'booking'
                : 'bookings'}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-300" />

                <p className="mt-4 text-sm text-slate-500">
                  Loading your appointments...
                </p>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center px-6 py-12">
              <div className="max-w-md text-center">
                <div className="se-icon-box mx-auto h-16 w-16 rounded-3xl text-indigo-300">
                  <CalendarDays
                    size={27}
                  />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  No appointments yet
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Book an available ServEase
                  service to create your first
                  appointment.
                </p>

                <button
                  onClick={() =>
                    navigate('/book')
                  }
                  className="se-btn-primary mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                >
                  <Plus size={17} />
                  Book Appointment
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10 bg-white/[0.025]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Service
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Staff
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Schedule
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Price
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Booking
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Payment
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Notes
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {appointments.map(
                      (appointment) => (
                        <tr
                          key={
                            appointment.id
                          }
                          className="border-b border-white/5 transition hover:bg-white/[0.035] last:border-0"
                        >
                          <td className="px-6 py-5">
                            <p className="font-medium text-white">
                              {appointment
                                .service?.name ??
                                'Service'}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <UserRound
                                size={15}
                                className="text-slate-500"
                              />

                              {appointment.staff_name ??
                                'Unassigned'}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            <p className="text-sm text-slate-300">
                              {
                                appointment.appointment_date
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {appointment.appointment_time.slice(
                                0,
                                5
                              )}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 font-medium text-slate-200">
                            {appointment.service
                              ? `₱${Number(
                                  appointment
                                    .service
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

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium capitalize ${getStatusStyles(
                                appointment.status
                              )}`}
                            >
                              {
                                appointment.status
                              }
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            {appointment.payment_status ? (
                              <div>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium capitalize ${getPaymentStyles(
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
                              <span className="inline-flex rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-500">
                                No payment
                              </span>
                            )}
                          </td>

                          <td className="max-w-[220px] px-6 py-5 text-sm text-slate-500">
                            {appointment.notes ||
                              '—'}
                          </td>

                          <td className="px-6 py-5">
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
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:-translate-y-0.5 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <XCircle
                                  size={
                                    15
                                  }
                                />

                                {cancellingId ===
                                appointment.id
                                  ? 'Cancelling...'
                                  : 'Cancel'}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-700">
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

              {/* MOBILE / TABLET CARDS */}
              <div className="grid gap-4 p-5 lg:hidden">
                {appointments.map(
                  (appointment) => (
                    <article
                      key={appointment.id}
                      className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/55 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                            Service
                          </p>

                          <h3 className="mt-2 text-lg font-semibold">
                            {appointment
                              .service?.name ??
                              'Service'}
                          </h3>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${getStatusStyles(
                            appointment.status
                          )}`}
                        >
                          {
                            appointment.status
                          }
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-600">
                            Assigned Staff
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {appointment.staff_name ??
                              'Unassigned'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-600">
                            Schedule
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {
                              appointment.appointment_date
                            }{' '}
                            •{' '}
                            {appointment.appointment_time.slice(
                              0,
                              5
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-600">
                            Service Price
                          </p>

                          <p className="mt-1 text-sm font-medium text-white">
                            {appointment.service
                              ? `₱${Number(
                                  appointment
                                    .service
                                    .price
                                ).toLocaleString(
                                  'en-PH',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}`
                              : '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-600">
                            Payment
                          </p>

                          <div className="mt-2">
                            {appointment.payment_status ? (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${getPaymentStyles(
                                  appointment.payment_status
                                )}`}
                              >
                                {
                                  appointment.payment_status
                                }
                              </span>
                            ) : (
                              <span className="text-sm text-slate-500">
                                No payment
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                          <p className="text-xs text-slate-600">
                            Notes
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {
                              appointment.notes
                            }
                          </p>
                        </div>
                      )}

                      {appointment.status ===
                        'pending' && (
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
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle
                            size={17}
                          />

                          {cancellingId ===
                          appointment.id
                            ? 'Cancelling...'
                            : 'Cancel Appointment'}
                        </button>
                      )}
                    </article>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

export default CustomerDashboard