import { useEffect, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '../lib/supabase'

type Appointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  customer: {
    full_name: string
  } | null
  service: {
    name: string
  } | null
}

type BookingStatusRow = {
  status: string
}

type PaidPayment = {
  amount: number
  paid_at: string | null
  created_at: string
}

type RevenuePoint = {
  month: string
  revenue: number
}

type BookingStatusPoint = {
  name: string
  value: number
  color: string
}

function AdminDashboard() {
  const navigate = useNavigate()

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [activeStaff, setActiveStaff] = useState(0)

  const [todayAppointments, setTodayAppointments] =
    useState<Appointment[]>([])

  const [revenueData, setRevenueData] =
    useState<RevenuePoint[]>([])

  const [bookingStatusData, setBookingStatusData] =
    useState<BookingStatusPoint[]>([])

  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const loadDashboardStats = async () => {
      setLoadingStats(true)

      try {
        const [
          bookingsResult,
          customersResult,
          staffResult,
          paymentsResult,
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('status', {
              count: 'exact',
            }),

          supabase
            .from('profiles')
            .select('*', {
              count: 'exact',
              head: true,
            })
            .eq('role', 'customer'),

          supabase
            .from('staff_profiles')
            .select('*', {
              count: 'exact',
              head: true,
            })
            .eq('is_active', true),

          supabase
            .from('payments')
            .select(`
              amount,
              paid_at,
              created_at
            `)
            .eq('payment_status', 'paid'),
        ])

        if (bookingsResult.error) {
          console.error(
            'Bookings error:',
            bookingsResult.error
          )
        }

        if (customersResult.error) {
          console.error(
            'Customers error:',
            customersResult.error
          )
        }

        if (staffResult.error) {
          console.error(
            'Staff error:',
            staffResult.error
          )
        }

        if (paymentsResult.error) {
          console.error(
            'Payments error:',
            paymentsResult.error
          )
        }

        setTotalBookings(
          bookingsResult.count ?? 0
        )

        setTotalCustomers(
          customersResult.count ?? 0
        )

        setActiveStaff(
          staffResult.count ?? 0
        )

        /*
         * BOOKING STATUS ANALYTICS
         */
        const bookingRows =
          (bookingsResult.data as BookingStatusRow[] | null) ?? []

        const pendingCount = bookingRows.filter(
          (booking) => booking.status === 'pending'
        ).length

        const confirmedCount = bookingRows.filter(
          (booking) => booking.status === 'confirmed'
        ).length

        const completedCount = bookingRows.filter(
          (booking) => booking.status === 'completed'
        ).length

        const cancelledCount = bookingRows.filter(
          (booking) => booking.status === 'cancelled'
        ).length

        setBookingStatusData([
          {
            name: 'Pending',
            value: pendingCount,
            color: '#6366f1',
          },
          {
            name: 'Confirmed',
            value: confirmedCount,
            color: '#22d3ee',
          },
          {
            name: 'Completed',
            value: completedCount,
            color: '#34d399',
          },
          {
            name: 'Cancelled',
            value: cancelledCount,
            color: '#fb7185',
          },
        ])

        /*
         * REVENUE ANALYTICS
         */
        const paidPayments =
          (paymentsResult.data as PaidPayment[] | null) ?? []

        const revenue = paidPayments.reduce(
          (total, payment) =>
            total + Number(payment.amount),
          0
        )

        setTotalRevenue(revenue)

        const months: RevenuePoint[] = []

        const now = new Date()

        for (let index = 5; index >= 0; index--) {
          const monthDate = new Date(
            now.getFullYear(),
            now.getMonth() - index,
            1
          )

          const year = monthDate.getFullYear()
          const month = monthDate.getMonth()

          const monthRevenue = paidPayments
            .filter((payment) => {
              const paymentDate = new Date(
                payment.paid_at ??
                  payment.created_at
              )

              return (
                paymentDate.getFullYear() === year &&
                paymentDate.getMonth() === month
              )
            })
            .reduce(
              (total, payment) =>
                total + Number(payment.amount),
              0
            )

          months.push({
            month: monthDate.toLocaleDateString(
              'en-PH',
              {
                month: 'short',
              }
            ),
            revenue: monthRevenue,
          })
        }

        setRevenueData(months)

        /*
         * TODAY'S APPOINTMENTS
         */
        const today =
          new Date().toLocaleDateString('en-CA')

        const {
          data: appointmentsData,
          error: appointmentsError,
        } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            customer:profiles!appointments_customer_id_fkey (
              full_name
            ),
            service:services (
              name
            )
          `)
          .eq('appointment_date', today)
          .neq('status', 'cancelled')
          .order('appointment_time', {
            ascending: true,
          })

        if (appointmentsError) {
          console.error(
            'Today appointments error:',
            appointmentsError
          )
        } else {
          setTodayAppointments(
            (appointmentsData as unknown as Appointment[]) ??
              []
          )
        }
      } catch (error) {
        console.error(
          'Dashboard stats error:',
          error
        )
      } finally {
        setLoadingStats(false)
      }
    }

    loadDashboardStats()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const formatCurrency = (value: number) => {
    return `₱${Number(value).toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    )}`
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-72 border-r border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl lg:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
              ServEase
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Admin Console
            </h1>
          </div>

          <nav className="mt-10 space-y-2">
            <button
              onClick={() =>
                navigate('/admin')
              }
              className="flex w-full items-center gap-3 rounded-xl bg-indigo-500/15 px-4 py-3 text-left text-indigo-300"
            >
              <LayoutDashboard size={20} />
              Dashboard
            </button>

            <button
              onClick={() =>
                navigate('/admin/bookings')
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <CalendarDays size={20} />
              Bookings
            </button>

            <button
              onClick={() =>
                navigate('/admin/customers')
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Users size={20} />
              Customers
            </button>

            <button
              onClick={() =>
                navigate('/admin/staff')
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Users size={20} />
              Staff
            </button>

            <button
              onClick={() =>
                navigate('/admin/services')
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Wrench size={20} />
              Services
            </button>

            <button
              onClick={() =>
                navigate('/admin/payments')
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <CreditCard size={20} />
              Payments
            </button>

            <button
              onClick={() =>
                navigate('/admin/audit-logs')
              }
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Activity size={20} />
              Audit Logs
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Settings size={20} />
              Settings
            </button>
          </nav>

          <button
            onClick={handleLogout}
            className="mt-10 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut size={20} />
            Logout
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Welcome back
                </p>

                <h2 className="mt-1 text-3xl font-bold tracking-tight">
                  Business Overview
                </h2>
              </div>

              <button
                onClick={() =>
                  navigate('/admin/bookings')
                }
                className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Manage Bookings
              </button>
            </div>

            {/* STAT CARDS */}
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm text-slate-400">
                  Total Revenue
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {loadingStats
                    ? '...'
                    : `₱${totalRevenue.toLocaleString(
                        'en-PH',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`}
                </p>

                <p className="mt-2 text-sm text-emerald-400">
                  Paid transactions
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm text-slate-400">
                  Total Bookings
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {loadingStats
                    ? '...'
                    : totalBookings}
                </p>

                <p className="mt-2 text-sm text-indigo-400">
                  All appointments
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm text-slate-400">
                  Customers
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {loadingStats
                    ? '...'
                    : totalCustomers}
                </p>

                <p className="mt-2 text-sm text-cyan-400">
                  Registered customers
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm text-slate-400">
                  Active Staff
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {loadingStats
                    ? '...'
                    : activeStaff}
                </p>

                <p className="mt-2 text-sm text-amber-400">
                  Currently active
                </p>
              </div>
            </div>

            {/* REVENUE + TODAY */}
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Revenue Overview
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Paid revenue over the last 6 months
                    </p>
                  </div>

                  <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                    6 months
                  </div>
                </div>

                <div className="mt-6 h-72">
                  {loadingStats ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Loading revenue...
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart
                        data={revenueData}
                        margin={{
                          top: 10,
                          right: 10,
                          left: 10,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="month"
                          stroke="#64748b"
                          tickLine={false}
                          axisLine={false}
                          fontSize={12}
                        />

                        <YAxis
                          stroke="#64748b"
                          tickLine={false}
                          axisLine={false}
                          fontSize={12}
                          tickFormatter={(value) =>
                            `₱${Number(
                              value
                            ).toLocaleString('en-PH')}`
                          }
                        />

                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(
                              Number(value)
                            ),
                            'Revenue',
                          ]}
                          contentStyle={{
                            background:
                              '#0f172a',
                            border:
                              '1px solid rgba(255,255,255,0.1)',
                            borderRadius:
                              '12px',
                          }}
                          labelStyle={{
                            color: '#cbd5e1',
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            fill: '#6366f1',
                          }}
                          activeDot={{
                            r: 6,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold">
                  Today&apos;s Appointments
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Scheduled appointments for today
                </p>

                <div className="mt-5 space-y-3">
                  {loadingStats ? (
                    <p className="text-sm text-slate-500">
                      Loading appointments...
                    </p>
                  ) : todayAppointments.length ===
                    0 ? (
                    <div className="flex h-60 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
                      No appointments today
                    </div>
                  ) : (
                    todayAppointments.map(
                      (appointment) => (
                        <div
                          key={appointment.id}
                          className="rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-white">
                                {appointment
                                  .service
                                  ?.name ??
                                  'Service'}
                              </p>

                              <p className="mt-1 text-sm text-slate-400">
                                {appointment
                                  .customer
                                  ?.full_name ??
                                  'Customer'}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {appointment.appointment_time.slice(
                                  0,
                                  5
                                )}
                              </p>
                            </div>

                            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium capitalize text-indigo-300">
                              {
                                appointment.status
                              }
                            </span>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </div>

            {/* BOOKING STATUS OVERVIEW */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-semibold">
                  Booking Status Overview
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Distribution of all appointment statuses
                </p>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                <div className="h-80">
                  {loadingStats ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Loading booking data...
                    </div>
                  ) : totalBookings === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No booking data available
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={bookingStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={115}
                          paddingAngle={4}
                        >
                          {bookingStatusData.map(
                            (entry) => (
                              <Cell
                                key={entry.name}
                                fill={entry.color}
                                stroke="transparent"
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          contentStyle={{
                            background:
                              '#0f172a',
                            border:
                              '1px solid rgba(255,255,255,0.1)',
                            borderRadius:
                              '12px',
                          }}
                          labelStyle={{
                            color: '#cbd5e1',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="grid content-center gap-4 sm:grid-cols-2">
                  {bookingStatusData.map(
                    (status) => (
                      <div
                        key={status.name}
                        className="rounded-xl border border-white/10 bg-slate-900/50 p-5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                status.color,
                            }}
                          />

                          <p className="text-sm text-slate-400">
                            {status.name}
                          </p>
                        </div>

                        <p className="mt-3 text-2xl font-bold text-white">
                          {status.value}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {totalBookings > 0
                            ? `${Math.round(
                                (status.value /
                                  totalBookings) *
                                  100
                              )}% of bookings`
                            : '0% of bookings'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminDashboard