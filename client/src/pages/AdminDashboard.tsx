import { useEffect, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Users,
  Wrench,
  X,
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

type NavItem = {
  label: string
  path: string
  icon: React.ElementType
}

function AdminDashboard() {
  const navigate = useNavigate()

  const [totalRevenue, setTotalRevenue] =
    useState(0)

  const [totalBookings, setTotalBookings] =
    useState(0)

  const [totalCustomers, setTotalCustomers] =
    useState(0)

  const [activeStaff, setActiveStaff] =
    useState(0)

  const [todayAppointments, setTodayAppointments] =
    useState<Appointment[]>([])

  const [revenueData, setRevenueData] =
    useState<RevenuePoint[]>([])

  const [
    bookingStatusData,
    setBookingStatusData,
  ] = useState<BookingStatusPoint[]>([])

  const [loadingStats, setLoadingStats] =
    useState(true)

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Bookings',
      path: '/admin/bookings',
      icon: CalendarDays,
    },
    {
      label: 'Customers',
      path: '/admin/customers',
      icon: Users,
    },
    {
      label: 'Staff',
      path: '/admin/staff',
      icon: Users,
    },
    {
      label: 'Services',
      path: '/admin/services',
      icon: Wrench,
    },
    {
      label: 'Payments',
      path: '/admin/payments',
      icon: CreditCard,
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: Activity,
    },
  ]

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
          (bookingsResult.data as
            | BookingStatusRow[]
            | null) ?? []

        const pendingCount =
          bookingRows.filter(
            (booking) =>
              booking.status === 'pending'
          ).length

        const confirmedCount =
          bookingRows.filter(
            (booking) =>
              booking.status === 'confirmed'
          ).length

        const completedCount =
          bookingRows.filter(
            (booking) =>
              booking.status === 'completed'
          ).length

        const cancelledCount =
          bookingRows.filter(
            (booking) =>
              booking.status === 'cancelled'
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
          (paymentsResult.data as
            | PaidPayment[]
            | null) ?? []

        const revenue =
          paidPayments.reduce(
            (total, payment) =>
              total +
              Number(payment.amount),
            0
          )

        setTotalRevenue(revenue)

        const months: RevenuePoint[] = []

        const now = new Date()

        for (
          let index = 5;
          index >= 0;
          index--
        ) {
          const monthDate = new Date(
            now.getFullYear(),
            now.getMonth() - index,
            1
          )

          const year =
            monthDate.getFullYear()

          const month =
            monthDate.getMonth()

          const monthRevenue =
            paidPayments
              .filter((payment) => {
                const paymentDate =
                  new Date(
                    payment.paid_at ??
                      payment.created_at
                  )

                return (
                  paymentDate.getFullYear() ===
                    year &&
                  paymentDate.getMonth() ===
                    month
                )
              })
              .reduce(
                (total, payment) =>
                  total +
                  Number(
                    payment.amount
                  ),
                0
              )

          months.push({
            month:
              monthDate.toLocaleDateString(
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
          new Date().toLocaleDateString(
            'en-CA'
          )

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
          .eq(
            'appointment_date',
            today
          )
          .neq('status', 'cancelled')
          .order(
            'appointment_time',
            {
              ascending: true,
            }
          )

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

  const formatCurrency = (
    value: number
  ) => {
    return `₱${Number(
      value
    ).toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const getAppointmentStatusStyle = (
    status: string
  ) => {
    switch (status) {
      case 'confirmed':
        return 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'

      case 'completed':
        return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'

      case 'cancelled':
        return 'border-rose-400/20 bg-rose-400/10 text-rose-300'

      default:
        return 'border-indigo-400/20 bg-indigo-400/10 text-indigo-300'
    }
  }

  const renderNavigation = (
    mobile = false
  ) => (
    <nav className="mt-8 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const active =
          item.path === '/admin'

        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path)

              if (mobile) {
                setMobileMenuOpen(
                  false
                )
              }
            }}
            className={
              active
                ? 'flex w-full items-center gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-left text-indigo-200 shadow-[0_0_24px_rgba(99,102,241,0.08)]'
                : 'flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-slate-400 transition hover:border-white/5 hover:bg-white/5 hover:text-white'
            }
          >
            <Icon size={19} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <main className="se-page se-grid-bg relative min-h-screen overflow-hidden text-white">
      {/* BACKGROUND GLOWS */}
      <div className="se-orb se-orb-indigo -left-32 top-12" />

      <div className="se-orb se-orb-cyan -right-28 top-32" />

      <div className="se-orb se-orb-violet bottom-[-140px] left-[45%]" />

      <div className="relative z-10 flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[290px] shrink-0 border-r border-white/10 bg-slate-950/55 p-6 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="se-icon-box h-12 w-12 rounded-2xl text-indigo-300">
              <Sparkles size={22} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">
                ServEase
              </p>

              <p className="mt-1 text-sm font-medium text-white">
                Admin Console
              </p>
            </div>
          </div>

          {renderNavigation()}

          <div className="mt-auto pt-8">
            <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                Access Level
              </p>

              <p className="mt-2 text-sm font-medium text-slate-300">
                Administrator
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/10 px-4 py-3 text-left text-rose-300 transition hover:border-rose-500/20 hover:bg-rose-500/10"
            >
              <LogOut size={19} />
              Logout
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-[290px] border-r border-white/10 bg-slate-950 p-6 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="se-icon-box h-11 w-11 rounded-2xl text-indigo-300">
                    <Sparkles size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
                      ServEase
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      Admin Console
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {renderNavigation(true)}

              <button
                onClick={handleLogout}
                className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-rose-500/10 px-4 py-3 text-left text-rose-300"
              >
                <LogOut size={19} />
                Logout
              </button>
            </aside>
          </>
        )}

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1">
          {/* MOBILE TOP BAR */}
          <div className="border-b border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="se-icon-box h-10 w-10 rounded-xl text-indigo-300">
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                    ServEase
                  </p>

                  <p className="text-sm font-medium">
                    Admin Console
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
            {/* PAGE HEADER */}
            <header className="se-glass rounded-[28px] px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
                    Business Operations
                  </p>

                  <h1 className="se-gradient-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    Business Overview
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Review live ServEase
                    bookings, revenue,
                    customers, active staff,
                    and appointment activity.
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      '/admin/bookings'
                    )
                  }
                  className="se-btn-primary flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                >
                  <CalendarDays
                    size={18}
                  />
                  Manage Bookings
                </button>
              </div>
            </header>

            {/* LIVE STAT CARDS */}
            <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {/* REVENUE */}
              <div className="se-glass se-card-3d rounded-[24px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      Total Revenue
                    </p>

                    <p className="mt-3 text-3xl font-bold xl:text-4xl">
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

                    <p className="mt-2 text-xs text-emerald-400">
                      Paid payment records
                    </p>
                  </div>

                  <div className="se-icon-box h-12 w-12 shrink-0 rounded-2xl text-emerald-300">
                    <CircleDollarSign
                      size={21}
                    />
                  </div>
                </div>
              </div>

              {/* BOOKINGS */}
              <div className="se-glass se-card-3d rounded-[24px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      Total Bookings
                    </p>

                    <p className="mt-3 text-4xl font-bold">
                      {loadingStats
                        ? '...'
                        : totalBookings}
                    </p>

                    <p className="mt-2 text-xs text-indigo-400">
                      All appointment records
                    </p>
                  </div>

                  <div className="se-icon-box h-12 w-12 shrink-0 rounded-2xl text-indigo-300">
                    <CalendarDays
                      size={21}
                    />
                  </div>
                </div>
              </div>

              {/* CUSTOMERS */}
              <div className="se-glass se-card-3d rounded-[24px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      Customers
                    </p>

                    <p className="mt-3 text-4xl font-bold">
                      {loadingStats
                        ? '...'
                        : totalCustomers}
                    </p>

                    <p className="mt-2 text-xs text-cyan-400">
                      Registered customer
                      profiles
                    </p>
                  </div>

                  <div className="se-icon-box h-12 w-12 shrink-0 rounded-2xl text-cyan-300">
                    <Users size={21} />
                  </div>
                </div>
              </div>

              {/* ACTIVE STAFF */}
              <div className="se-glass se-card-3d rounded-[24px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      Active Staff
                    </p>

                    <p className="mt-3 text-4xl font-bold">
                      {loadingStats
                        ? '...'
                        : activeStaff}
                    </p>

                    <p className="mt-2 text-xs text-violet-400">
                      Active staff profiles
                    </p>
                  </div>

                  <div className="se-icon-box h-12 w-12 shrink-0 rounded-2xl text-violet-300">
                    <Users size={21} />
                  </div>
                </div>
              </div>
            </section>

            {/* REVENUE + TODAY */}
            <section className="mt-7 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
              {/* REVENUE CHART */}
              <div className="se-glass rounded-[28px] p-6 sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                      Payments
                    </p>

                    <h2 className="mt-2 text-xl font-semibold">
                      Revenue Overview
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Paid ServEase revenue
                      during the last six
                      months.
                    </p>
                  </div>

                  <div className="se-badge rounded-full px-4 py-2 text-xs">
                    6 months
                  </div>
                </div>

                <div className="mt-8 h-[300px] sm:h-[340px]">
                  {loadingStats ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-300" />

                        <p className="mt-4 text-sm text-slate-500">
                          Loading revenue...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart
                        data={revenueData}
                        margin={{
                          top: 15,
                          right: 15,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
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
                          tickFormatter={(
                            value
                          ) =>
                            `₱${Number(
                              value
                            ).toLocaleString(
                              'en-PH'
                            )}`
                          }
                        />

                        <Tooltip
                          formatter={(
                            value
                          ) => [
                            formatCurrency(
                              Number(value)
                            ),
                            'Revenue',
                          ]}
                          contentStyle={{
                            background:
                              'rgba(2, 6, 23, 0.96)',
                            border:
                              '1px solid rgba(255,255,255,0.1)',
                            borderRadius:
                              '16px',
                            boxShadow:
                              '0 20px 60px rgba(0,0,0,0.4)',
                          }}
                          labelStyle={{
                            color:
                              '#cbd5e1',
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#818cf8"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            fill: '#818cf8',
                            strokeWidth: 0,
                          }}
                          activeDot={{
                            r: 6,
                            fill: '#67e8f9',
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* TODAY'S APPOINTMENTS */}
              <div className="se-glass rounded-[28px] p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Today
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Today's Appointments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Non-cancelled appointments
                  scheduled for today.
                </p>

                <div className="mt-6 space-y-3">
                  {loadingStats ? (
                    <div className="flex min-h-[250px] items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />

                        <p className="mt-4 text-sm text-slate-500">
                          Loading appointments...
                        </p>
                      </div>
                    </div>
                  ) : todayAppointments.length ===
                    0 ? (
                    <div className="flex min-h-[250px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.015]">
                      <div className="text-center">
                        <div className="se-icon-box mx-auto h-14 w-14 rounded-2xl text-cyan-300">
                          <CalendarDays
                            size={23}
                          />
                        </div>

                        <p className="mt-4 text-sm text-slate-500">
                          No appointments
                          today
                        </p>
                      </div>
                    </div>
                  ) : (
                    todayAppointments.map(
                      (appointment) => (
                        <article
                          key={
                            appointment.id
                          }
                          className="se-card-3d rounded-2xl border border-white/10 bg-slate-950/40 p-4"
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

                              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                <CalendarDays
                                  size={13}
                                />

                                {appointment.appointment_time.slice(
                                  0,
                                  5
                                )}
                              </div>
                            </div>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getAppointmentStatusStyle(
                                appointment.status
                              )}`}
                            >
                              {
                                appointment.status
                              }
                            </span>
                          </div>
                        </article>
                      )
                    )
                  )}
                </div>
              </div>
            </section>

            {/* BOOKING STATUS */}
            <section className="se-glass mt-7 rounded-[28px] p-6 sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                  Appointment Analytics
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Booking Status Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Distribution of real
                  appointment statuses in
                  ServEase.
                </p>
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                {/* DONUT */}
                <div className="relative h-[320px]">
                  {loadingStats ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />

                        <p className="mt-4 text-sm text-slate-500">
                          Loading booking
                          data...
                        </p>
                      </div>
                    </div>
                  ) : totalBookings ===
                    0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No booking data
                      available
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={
                              bookingStatusData
                            }
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={78}
                            outerRadius={118}
                            paddingAngle={4}
                          >
                            {bookingStatusData.map(
                              (
                                entry
                              ) => (
                                <Cell
                                  key={
                                    entry.name
                                  }
                                  fill={
                                    entry.color
                                  }
                                  stroke="transparent"
                                />
                              )
                            )}
                          </Pie>

                          <Tooltip
                            contentStyle={{
                              background:
                                'rgba(2, 6, 23, 0.96)',
                              border:
                                '1px solid rgba(255,255,255,0.1)',
                              borderRadius:
                                '16px',
                            }}
                            labelStyle={{
                              color:
                                '#cbd5e1',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-4xl font-bold">
                            {
                              totalBookings
                            }
                          </p>

                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-600">
                            Bookings
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* STATUS CARDS */}
                <div className="grid content-center gap-4 sm:grid-cols-2">
                  {bookingStatusData.map(
                    (status) => (
                      <div
                        key={status.name}
                        className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/45 p-5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full shadow-[0_0_12px_currentColor]"
                            style={{
                              backgroundColor:
                                status.color,
                            }}
                          />

                          <p className="text-sm text-slate-400">
                            {status.name}
                          </p>
                        </div>

                        <p className="mt-4 text-3xl font-bold">
                          {loadingStats
                            ? '...'
                            : status.value}
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          {totalBookings >
                          0
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
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminDashboard