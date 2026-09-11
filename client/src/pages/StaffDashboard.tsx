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

  /*
   * LOAD STAFF DATA
   */
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

      /*
       * STAFF PROFILE
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
          'Failed to load staff profile:',
          profileError
        )
      } else {
        setStaffName(
          profileData.full_name || 'Staff'
        )
      }

      /*
       * ASSIGNED APPOINTMENTS
       */
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

  /*
   * LIVE STATS
   */
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

  /*
   * UPDATE APPOINTMENT STATUS
   */
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

    /*
     * AUDIT LOG
     */
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

  /*
   * LOGOUT
   */
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  /*
   * STATUS STYLES
   */
  const getStatusStyles = (
    status: AppointmentStatus
  ) => {
    switch (status) {
      case 'confirmed':
        return 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.08)]'

      case 'completed':
        return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.08)]'

      case 'cancelled':
        return 'border-rose-400/20 bg-rose-400/10 text-rose-300'

      default:
        return 'border-indigo-400/20 bg-indigo-400/10 text-indigo-300 shadow-[0_0_18px_rgba(99,102,241,0.08)]'
    }
  }

  return (
    <main className="se-page se-grid-bg relative min-h-screen overflow-hidden text-white">
      {/* BACKGROUND */}
      <div className="se-orb se-orb-indigo -left-28 top-10" />

      <div className="se-orb se-orb-cyan -right-24 top-40" />

      <div className="se-orb se-orb-violet bottom-[-120px] left-[42%]" />

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
                  Staff Dashboard
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                  Welcome, {staffName}. Manage
                  your assigned appointments and
                  service status.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="se-btn-secondary flex self-start items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-red-300 hover:text-red-200 lg:self-auto"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        {/* LIVE STAFF STATS */}
        <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* ASSIGNED */}
          <div className="se-glass se-card-3d rounded-[24px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Assigned
                </p>

                <p className="mt-3 text-4xl font-bold">
                  {loading
                    ? '...'
                    : appointments.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Total assigned appointments
                </p>
              </div>

              <div className="se-icon-box h-12 w-12 rounded-2xl text-indigo-300">
                <CalendarDays size={21} />
              </div>
            </div>
          </div>

          {/* PENDING */}
          <div className="se-glass se-card-3d rounded-[24px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Pending
                </p>

                <p className="mt-3 text-4xl font-bold">
                  {loading
                    ? '...'
                    : pendingAppointments.length}
                </p>

                <p className="mt-2 text-xs text-indigo-400">
                  Waiting for confirmation
                </p>
              </div>

              <div className="se-icon-box h-12 w-12 rounded-2xl text-indigo-300">
                <Clock3 size={21} />
              </div>
            </div>
          </div>

          {/* CONFIRMED */}
          <div className="se-glass se-card-3d rounded-[24px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Confirmed
                </p>

                <p className="mt-3 text-4xl font-bold">
                  {loading
                    ? '...'
                    : confirmedAppointments.length}
                </p>

                <p className="mt-2 text-xs text-cyan-400">
                  Confirmed service bookings
                </p>
              </div>

              <div className="se-icon-box h-12 w-12 rounded-2xl text-cyan-300">
                <CalendarDays size={21} />
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
                <CheckCircle2 size={21} />
              </div>
            </div>
          </div>
        </section>

        {/* ASSIGNED APPOINTMENTS */}
        <section className="se-glass mt-7 overflow-hidden rounded-[28px]">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
                Staff Workflow
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Assigned Appointments
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                View customers, services,
                schedules, notes, and update
                appointment status.
              </p>
            </div>

            <div className="se-badge rounded-full px-4 py-2 text-xs">
              <Wrench size={14} />

              {appointments.length}{' '}
              {appointments.length === 1
                ? 'assignment'
                : 'assignments'}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-300" />

                <p className="mt-4 text-sm text-slate-500">
                  Loading assigned
                  appointments...
                </p>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center px-6 py-12">
              <div className="max-w-md text-center">
                <div className="se-icon-box mx-auto h-16 w-16 rounded-3xl text-indigo-300">
                  <CalendarDays size={27} />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  No assigned appointments
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Appointments assigned to your
                  staff account by an administrator
                  will appear here.
                </p>
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
                        Customer
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Service
                      </th>

                      <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Schedule
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
                    {appointments.map(
                      (appointment) => (
                        <tr
                          key={appointment.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.035] last:border-0"
                        >
                          {/* CUSTOMER */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="se-icon-box h-10 w-10 rounded-xl text-indigo-300">
                                <UserRound
                                  size={17}
                                />
                              </div>

                              <span className="font-medium text-white">
                                {appointment
                                  .customer
                                  ?.full_name ??
                                  'Customer'}
                              </span>
                            </div>
                          </td>

                          {/* SERVICE */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <Wrench
                                size={15}
                                className="text-slate-500"
                              />

                              <span className="text-sm text-slate-300">
                                {appointment
                                  .service
                                  ?.name ??
                                  'Service'}
                              </span>
                            </div>
                          </td>

                          {/* DATE / TIME */}
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

                          {/* STATUS */}
                          <td className="px-6 py-5">
                            <select
                              value={
                                appointment.status
                              }
                              disabled={
                                updatingId ===
                                appointment.id
                              }
                              onChange={(
                                event
                              ) =>
                                handleStatusChange(
                                  appointment.id,
                                  event
                                    .target
                                    .value as AppointmentStatus
                                )
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyles(
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

                            {updatingId ===
                              appointment.id && (
                              <p className="mt-2 text-xs text-slate-500">
                                Updating...
                              </p>
                            )}
                          </td>

                          {/* NOTES */}
                          <td className="max-w-[320px] px-6 py-5 text-sm text-slate-400">
                            {appointment.notes ||
                              '—'}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET */}
              <div className="grid gap-4 p-5 lg:hidden">
                {appointments.map(
                  (appointment) => (
                    <article
                      key={appointment.id}
                      className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/55 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="se-icon-box h-11 w-11 rounded-xl text-indigo-300">
                            <UserRound
                              size={18}
                            />
                          </div>

                          <div>
                            <p className="text-xs text-slate-600">
                              Customer
                            </p>

                            <h3 className="mt-1 font-semibold">
                              {appointment
                                .customer
                                ?.full_name ??
                                'Customer'}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${getStatusStyles(
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
                            Service
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {appointment
                              .service
                              ?.name ??
                              'Service'}
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

                      <div className="mt-5">
                        <label className="mb-2 block text-xs font-medium text-slate-500">
                          Update appointment
                          status
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
                          className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium capitalize outline-none ${getStatusStyles(
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

                        {updatingId ===
                          appointment.id && (
                          <p className="mt-2 text-xs text-slate-500">
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
        </section>
      </div>
    </main>
  )
}

export default StaffDashboard