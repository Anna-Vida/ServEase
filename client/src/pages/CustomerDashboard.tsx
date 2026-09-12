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

      const mergedAppointments:
        CustomerAppointment[] =
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

  const getStatusStyles = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#eaf3ff] text-[#3569a6]'

      case 'completed':
        return 'bg-[#e9f8f1] text-[#16845b]'

      case 'cancelled':
        return 'bg-[#fff0ec] text-[#c9472d]'

      default:
        return 'bg-[#fff3d7] text-[#b26a00]'
    }
  }

  const getPaymentStyles = (
    status: PaymentStatus
  ) => {
    switch (status) {
      case 'paid':
        return 'bg-[#e9f8f1] text-[#16845b]'

      case 'failed':
        return 'bg-[#fff0ec] text-[#c9472d]'

      case 'refunded':
        return 'bg-[#f2edff] text-[#6c55aa]'

      default:
        return 'bg-[#fff3d7] text-[#b26a00]'
    }
  }

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const formatCurrency = (
    value: number
  ) => {
    return `₱${Number(value).toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] text-[#1c1410]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#f1ded0] bg-[#fff8f1]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white shadow-[0_12px_30px_-12px_rgba(255,107,74,0.6)]">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight">
                ServEase
              </p>

              <p className="text-xs text-[#8b7c73]">
                Customer Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                navigate('/book')
              }
              className="se-btn-primary hidden items-center gap-2 px-5 py-2.5 text-sm sm:flex"
            >
              <Plus size={17} />
              Book Appointment
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7d4c6] bg-white px-4 text-sm font-semibold text-[#74675f] transition hover:border-[#ffb9a3] hover:text-[#c9472d]"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        {/* PAGE INTRO */}
        <section className="flex flex-col gap-8 border-b border-[#ead7ca] pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-[#ff6b4a]">
              Customer dashboard
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              Welcome back,{' '}
              <span className="se-gradient-text">
                {customerName}
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#74675f]">
              View your appointments, assigned
              staff, booking status, and payment
              information in one place.
            </p>
          </div>

          <button
            onClick={() =>
              navigate('/book')
            }
            className="se-btn-primary flex items-center gap-2 self-start px-6 py-3 text-sm sm:hidden"
          >
            <Plus size={17} />
            Book Appointment
          </button>
        </section>

        {/* LIVE STATS - FLAT, NOT BENTO */}
        <section className="grid border-b border-[#ead7ca] py-9 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-[#ead7ca] py-5 sm:border-r sm:px-5 lg:border-b-0 lg:px-6 lg:first:pl-0">
            <div className="flex items-center gap-2 text-[#ff6b4a]">
              <CalendarDays size={17} />

              <p className="text-xs font-bold uppercase tracking-[0.12em]">
                Total Bookings
              </p>
            </div>

            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {loading
                ? '...'
                : appointments.length}
            </p>

            <p className="mt-1 text-sm text-[#8b7c73]">
              All appointments
            </p>
          </div>

          <div className="border-b border-[#ead7ca] py-5 sm:px-5 lg:border-b-0 lg:border-r lg:px-6">
            <div className="flex items-center gap-2 text-[#d98500]">
              <Clock3 size={17} />

              <p className="text-xs font-bold uppercase tracking-[0.12em]">
                Upcoming
              </p>
            </div>

            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {loading
                ? '...'
                : upcomingAppointments.length}
            </p>

            <p className="mt-1 text-sm text-[#8b7c73]">
              Future appointments
            </p>
          </div>

          <div className="border-b border-[#ead7ca] py-5 sm:border-r sm:px-5 lg:border-b-0 lg:px-6">
            <div className="flex items-center gap-2 text-[#16845b]">
              <CheckCircle2 size={17} />

              <p className="text-xs font-bold uppercase tracking-[0.12em]">
                Completed
              </p>
            </div>

            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {loading
                ? '...'
                : completedAppointments.length}
            </p>

            <p className="mt-1 text-sm text-[#8b7c73]">
              Finished appointments
            </p>
          </div>

          <div className="py-5 sm:px-5 lg:px-6 lg:pr-0">
            <div className="flex items-center gap-2 text-[#6c55aa]">
              <CreditCard size={17} />

              <p className="text-xs font-bold uppercase tracking-[0.12em]">
                Paid
              </p>
            </div>

            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {loading
                ? '...'
                : paidAppointments.length}
            </p>

            <p className="mt-1 text-sm text-[#8b7c73]">
              Paid appointments
            </p>
          </div>
        </section>

        {/* APPOINTMENTS HEADER */}
        <section className="pt-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                Appointment activity
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                My Appointments
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#74675f]">
                Your service history and current
                booking activity.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff0e7] px-4 py-2 text-xs font-bold text-[#b95736]">
              <UserRound size={14} />

              {appointments.length}{' '}
              {appointments.length === 1
                ? 'booking'
                : 'bookings'}
            </div>
          </div>

          {/* CONTENT */}
          <div className="mt-7">
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center border-y border-[#ead7ca]">
                <div className="text-center">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                  <p className="mt-4 text-sm text-[#8b7c73]">
                    Loading your appointments...
                  </p>
                </div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center border-y border-[#ead7ca] px-6 py-12">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0e7] text-[#ff6b4a]">
                    <CalendarDays size={24} />
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    No appointments yet
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#74675f]">
                    Book an available ServEase
                    service to create your first
                    appointment.
                  </p>

                  <button
                    onClick={() =>
                      navigate('/book')
                    }
                    className="se-btn-primary mt-6 inline-flex items-center gap-2 px-5 py-3 text-sm"
                  >
                    <Plus size={17} />
                    Book Appointment
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden overflow-hidden rounded-2xl border border-[#ead7ca] bg-white lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[#fff7f0]">
                        <tr>
                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Service
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Staff
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Schedule
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Price
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Booking
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Payment
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Notes
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
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
                              className="border-t border-[#f4e5da] transition hover:bg-[#fffaf6]"
                            >
                              <td className="px-5 py-5">
                                <p className="font-semibold">
                                  {appointment
                                    .service?.name ??
                                    'Service'}
                                </p>
                              </td>

                              <td className="px-5 py-5">
                                <div className="flex items-center gap-2 text-sm text-[#65574f]">
                                  <UserRound
                                    size={15}
                                    className="text-[#a09187]"
                                  />

                                  {appointment.staff_name ??
                                    'Unassigned'}
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-5 py-5">
                                <p className="text-sm text-[#493c35]">
                                  {
                                    appointment.appointment_date
                                  }
                                </p>

                                <p className="mt-1 text-xs text-[#8b7c73]">
                                  {appointment.appointment_time.slice(
                                    0,
                                    5
                                  )}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-5 py-5 text-sm font-semibold">
                                {appointment.service
                                  ? formatCurrency(
                                      appointment
                                        .service
                                        .price
                                    )
                                  : '—'}
                              </td>

                              <td className="px-5 py-5">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyles(
                                    appointment.status
                                  )}`}
                                >
                                  {
                                    appointment.status
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-5">
                                {appointment.payment_status ? (
                                  <div>
                                    <span
                                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getPaymentStyles(
                                        appointment.payment_status
                                      )}`}
                                    >
                                      {
                                        appointment.payment_status
                                      }
                                    </span>

                                    {appointment.payment_amount !==
                                      null && (
                                      <p className="mt-2 text-xs text-[#8b7c73]">
                                        {formatCurrency(
                                          appointment.payment_amount
                                        )}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#a09187]">
                                    No payment
                                  </span>
                                )}
                              </td>

                              <td className="max-w-[220px] px-5 py-5 text-sm text-[#74675f]">
                                {appointment.notes ||
                                  '—'}
                              </td>

                              <td className="px-5 py-5">
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
                                    className="inline-flex items-center gap-2 rounded-full border border-[#f3c7bb] bg-[#fff0ec] px-3 py-2 text-xs font-bold text-[#c9472d] transition hover:bg-[#ffe5dd] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <XCircle size={15} />

                                    {cancellingId ===
                                    appointment.id
                                      ? 'Cancelling...'
                                      : 'Cancel'}
                                  </button>
                                ) : (
                                  <span className="text-xs text-[#b2a49b]">
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
                </div>

                {/* MOBILE LIST */}
                <div className="divide-y divide-[#ead7ca] border-y border-[#ead7ca] lg:hidden">
                  {appointments.map(
                    (appointment) => (
                      <article
                        key={appointment.id}
                        className="py-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff6b4a]">
                              Service
                            </p>

                            <h3 className="mt-1 text-lg font-bold">
                              {appointment
                                .service?.name ??
                                'Service'}
                            </h3>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyles(
                              appointment.status
                            )}`}
                          >
                            {
                              appointment.status
                            }
                          </span>
                        </div>

                        <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                              Assigned Staff
                            </dt>

                            <dd className="mt-1 text-sm text-[#493c35]">
                              {appointment.staff_name ??
                                'Unassigned'}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                              Schedule
                            </dt>

                            <dd className="mt-1 text-sm text-[#493c35]">
                              {
                                appointment.appointment_date
                              }{' '}
                              ·{' '}
                              {appointment.appointment_time.slice(
                                0,
                                5
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                              Price
                            </dt>

                            <dd className="mt-1 text-sm font-semibold">
                              {appointment.service
                                ? formatCurrency(
                                    appointment
                                      .service
                                      .price
                                  )
                                : '—'}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                              Payment
                            </dt>

                            <dd className="mt-1">
                              {appointment.payment_status ? (
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getPaymentStyles(
                                    appointment.payment_status
                                  )}`}
                                >
                                  {
                                    appointment.payment_status
                                  }
                                </span>
                              ) : (
                                <span className="text-sm text-[#8b7c73]">
                                  No payment
                                </span>
                              )}
                            </dd>
                          </div>
                        </dl>

                        {appointment.notes && (
                          <div className="mt-5 border-l-2 border-[#f0cdb8] pl-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                              Notes
                            </p>

                            <p className="mt-1 text-sm leading-6 text-[#74675f]">
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
                            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#f3c7bb] bg-[#fff0ec] px-4 py-2.5 text-sm font-bold text-[#c9472d] transition hover:bg-[#ffe5dd] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={16} />

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
          </div>
        </section>
      </div>
    </main>
  )
}

export default CustomerDashboard