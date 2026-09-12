import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'

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

  const [appointments, setAppointments] =
    useState<StaffAppointment[]>([])

  const [loading, setLoading] = useState(true)

  const [updatingId, setUpdatingId] =
    useState<string | null>(null)

  const [staffName, setStaffName] =
    useState('Staff')

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
          'Failed to load staff profile:',
          profileError
        )
      } else {
        setStaffName(
          profileData.full_name || 'Staff'
        )
      }

      const { data, error } =
        await supabase
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
          .order('appointment_date', {
            ascending: true,
          })
          .order('appointment_time', {
            ascending: true,
          })

      if (error) {
        console.error(
          'Failed to load assigned appointments:',
          error
        )

        setAppointments([])
      } else {
        setAppointments(
          (data as unknown as StaffAppointment[]) ??
            []
        )
      }

      setLoading(false)
    }

    loadStaffDashboard()
  }, [navigate])

  const pendingAppointments =
    useMemo(() => {
      return appointments.filter(
        (appointment) =>
          appointment.status === 'pending'
      )
    }, [appointments])

  const confirmedAppointments =
    useMemo(() => {
      return appointments.filter(
        (appointment) =>
          appointment.status === 'confirmed'
      )
    }, [appointments])

  const completedAppointments =
    useMemo(() => {
      return appointments.filter(
        (appointment) =>
          appointment.status === 'completed'
      )
    }, [appointments])

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: AppointmentStatus
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

    const previousStatus =
      appointment.status

    if (previousStatus === newStatus) {
      return
    }

    setUpdatingId(appointmentId)

    const { error } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (error) {
      console.error(
        'Failed to update appointment:',
        error
      )

      setUpdatingId(null)
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
                  status: newStatus,
                }
              : currentAppointment
        )
    )

    await logAudit({
      action:
        'staff_booking_status_changed',

      entityType:
        'appointment',

      entityId:
        appointmentId,

      details: {
        previous_status:
          previousStatus,

        new_status:
          newStatus,

        customer:
          appointment.customer
            ?.full_name ?? null,

        service:
          appointment.service?.name ??
          null,

        appointment_date:
          appointment.appointment_date,

        appointment_time:
          appointment.appointment_time,
      },
    })

    setUpdatingId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getStatusStyles = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#eaf3ff] text-[#3569a6] border-[#cfe1f5]'

      case 'completed':
        return 'bg-[#e9f8f1] text-[#16845b] border-[#bfe7d6]'

      case 'cancelled':
        return 'bg-[#fff0ec] text-[#c9472d] border-[#f3c7bb]'

      default:
        return 'bg-[#fff3d7] text-[#b26a00] border-[#f4dda5]'
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] text-[#1c1410]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#f1ded0] bg-[#fff8f1]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white shadow-[0_12px_30px_-12px_rgba(255,107,74,0.6)]">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight">
                ServEase
              </p>

              <p className="text-xs text-[#8b7c73]">
                Staff Workspace
              </p>
            </div>
          </div>

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
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        {/* INTRO */}
        <section className="border-b border-[#ead7ca] pb-10">
          <p className="text-sm font-bold text-[#ff6b4a]">
            Staff dashboard
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            Welcome,{' '}
            <span className="se-gradient-text">
              {staffName}
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#74675f]">
            Review your assigned appointments,
            customer details, service schedules,
            and update booking status as work
            progresses.
          </p>
        </section>

        {/* STATS */}
        <section className="grid border-b border-[#ead7ca] py-9 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-[#ead7ca] py-5 sm:border-r sm:px-5 lg:border-b-0 lg:px-6 lg:first:pl-0">
            <div className="flex items-center gap-2 text-[#ff6b4a]">
              <CalendarDays size={17} />

              <p className="text-xs font-bold uppercase tracking-[0.12em]">
                Assigned
              </p>
            </div>

            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {loading
                ? '...'
                : appointments.length}
            </p>

            <p className="mt-1 text-sm text-[#8b7c73]">
              Total appointments
            </p>
          </div>

          <div className="border-b border-[#ead7ca] py-5 sm:px-5 lg:border-b-0 lg:border-r lg:px-6">
            <div className="flex items-center gap-2 text-[#d98500]">
              <Clock3 size={17} />

              <p className="text-xs font-bold uppercase tracking-[0.12em]">
                Pending
              </p>
            </div>

            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {loading
                ? '...'
                : pendingAppointments.length}
            </p>

            <p className="mt-1 text-sm text-[#8b7c73]">
              Waiting for confirmation
            </p>
          </div>

          <div className="border-b border-[#ead7ca] py-5 sm:border-r sm:px-5 lg:border-b-0 lg:px-6">
            <div className="flex items-center gap-2 text-[#3569a6]">
              <CalendarDays size={17} />

              <p className="text-xs font-bold uppercase tracking-[0.12em]">
                Confirmed
              </p>
            </div>

            <p className="mt-3 text-4xl font-extrabold tracking-tight">
              {loading
                ? '...'
                : confirmedAppointments.length}
            </p>

            <p className="mt-1 text-sm text-[#8b7c73]">
              Scheduled bookings
            </p>
          </div>

          <div className="py-5 sm:px-5 lg:px-6 lg:pr-0">
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
        </section>

        {/* APPOINTMENTS */}
        <section className="pt-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                Staff workflow
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                Assigned Appointments
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#74675f]">
                View customers, services, schedules,
                notes, and update appointment status.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff0e7] px-4 py-2 text-xs font-bold text-[#b95736]">
              <Wrench size={14} />

              {appointments.length}{' '}
              {appointments.length === 1
                ? 'assignment'
                : 'assignments'}
            </div>
          </div>

          <div className="mt-7">
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center border-y border-[#ead7ca]">
                <div className="text-center">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                  <p className="mt-4 text-sm text-[#8b7c73]">
                    Loading assigned appointments...
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
                    No assigned appointments
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#74675f]">
                    Appointments assigned to your
                    staff account by an administrator
                    will appear here.
                  </p>
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
                            Customer
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Service
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Schedule
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Status
                          </th>

                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Notes
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {appointments.map(
                          (appointment) => (
                            <tr
                              key={appointment.id}
                              className="border-t border-[#f4e5da] transition hover:bg-[#fffaf6]"
                            >
                              <td className="px-5 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0e7] text-[#ff6b4a]">
                                    <UserRound size={16} />
                                  </div>

                                  <span className="font-semibold">
                                    {appointment.customer
                                      ?.full_name ??
                                      'Customer'}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-5">
                                <div className="flex items-center gap-2 text-sm text-[#65574f]">
                                  <Wrench
                                    size={15}
                                    className="text-[#a09187]"
                                  />

                                  <span>
                                    {appointment.service
                                      ?.name ??
                                      'Service'}
                                  </span>
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

                              <td className="px-5 py-5">
                                <select
                                  value={
                                    appointment.status
                                  }
                                  disabled={
                                    updatingId ===
                                    appointment.id
                                  }
                                  onChange={(event) =>
                                    handleStatusChange(
                                      appointment.id,
                                      event.target
                                        .value as AppointmentStatus
                                    )
                                  }
                                  className={`rounded-full border px-3 py-2 text-xs font-bold capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyles(
                                    appointment.status
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
                                  appointment.id && (
                                  <p className="mt-2 text-xs text-[#8b7c73]">
                                    Updating...
                                  </p>
                                )}
                              </td>

                              <td className="max-w-[320px] px-5 py-5 text-sm leading-6 text-[#74675f]">
                                {appointment.notes ||
                                  '—'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MOBILE */}
                <div className="divide-y divide-[#ead7ca] border-y border-[#ead7ca] lg:hidden">
                  {appointments.map(
                    (appointment) => (
                      <article
                        key={appointment.id}
                        className="py-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0e7] text-[#ff6b4a]">
                              <UserRound size={17} />
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                                Customer
                              </p>

                              <h3 className="mt-1 font-bold">
                                {appointment.customer
                                  ?.full_name ??
                                  'Customer'}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyles(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>

                        <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                              Service
                            </dt>

                            <dd className="mt-1 text-sm text-[#493c35]">
                              {appointment.service
                                ?.name ??
                                'Service'}
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
                        </dl>

                        {appointment.notes && (
                          <div className="mt-5 border-l-2 border-[#f0cdb8] pl-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                              Notes
                            </p>

                            <p className="mt-1 text-sm leading-6 text-[#74675f]">
                              {appointment.notes}
                            </p>
                          </div>
                        )}

                        <div className="mt-5">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Update appointment status
                          </label>

                          <select
                            value={
                              appointment.status
                            }
                            disabled={
                              updatingId ===
                              appointment.id
                            }
                            onChange={(event) =>
                              handleStatusChange(
                                appointment.id,
                                event.target
                                  .value as AppointmentStatus
                              )
                            }
                            className={`w-full rounded-xl border px-4 py-3 text-sm font-bold capitalize outline-none ${getStatusStyles(
                              appointment.status
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
                            appointment.id && (
                            <p className="mt-2 text-xs text-[#8b7c73]">
                              Updating...
                            </p>
                          )}
                        </div>
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

export default StaffDashboard