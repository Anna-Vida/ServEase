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
            color: '#ffb020',
          },
          {
            name: 'Confirmed',
            value: confirmedCount,
            color: '#6e9ed2',
          },
          {
            name: 'Completed',
            value: completedCount,
            color: '#43a77b',
          },
          {
            name: 'Cancelled',
            value: cancelledCount,
            color: '#df6b56',
          },
        ])

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
        return 'bg-[#eaf3ff] text-[#3569a6]'

      case 'completed':
        return 'bg-[#e9f8f1] text-[#16845b]'

      case 'cancelled':
        return 'bg-[#fff0ec] text-[#c9472d]'

      default:
        return 'bg-[#fff3d7] text-[#b26a00]'
    }
  }

  const renderNavigation = (
    mobile = false
  ) => (
    <nav className="mt-8 space-y-1">
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
                setMobileMenuOpen(false)
              }
            }}
            className={
              active
                ? 'flex w-full items-center gap-3 rounded-xl bg-[#ffe9db] px-4 py-3 text-left font-semibold text-[#c45231]'
                : 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-[#75675f] transition hover:bg-[#fff0e6] hover:text-[#1c1410]'
            }
          >
            <Icon size={18} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <main className="min-h-screen bg-[#fff8f1] text-[#1c1410]">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[270px] shrink-0 border-r border-[#f1ded0] bg-[#fffaf5] p-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight">
                ServEase
              </p>

              <p className="text-xs text-[#8b7c73]">
                Admin Console
              </p>
            </div>
          </div>

          {renderNavigation()}

          <div className="mt-auto border-t border-[#ead7ca] pt-6">
            <p className="px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#a09187]">
              Access level
            </p>

            <p className="mt-2 px-4 text-sm font-semibold">
              Administrator
            </p>

            <button
              onClick={handleLogout}
              className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#c9472d] transition hover:bg-[#fff0ec]"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-[#1c1410]/35 lg:hidden"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-[#f1ded0] bg-[#fffaf5] p-6 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
                    <Sparkles size={18} />
                  </div>

                  <div>
                    <p className="font-extrabold">
                      ServEase
                    </p>

                    <p className="text-xs text-[#8b7c73]">
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
                  className="rounded-lg border border-[#ead7ca] bg-white p-2 text-[#74675f]"
                >
                  <X size={18} />
                </button>
              </div>

              {renderNavigation(true)}

              <button
                onClick={handleLogout}
                className="mt-8 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#c9472d] hover:bg-[#fff0ec]"
              >
                <LogOut size={18} />
                Logout
              </button>
            </aside>
          </>
        )}

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          {/* MOBILE BAR */}
          <div className="border-b border-[#f1ded0] bg-[#fffaf5] px-5 py-4 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
                  <Sparkles size={17} />
                </div>

                <div>
                  <p className="font-bold">
                    ServEase
                  </p>

                  <p className="text-xs text-[#8b7c73]">
                    Admin Console
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-lg border border-[#ead7ca] bg-white p-2.5 text-[#493c35]"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1500px] px-6 py-10 lg:px-10 lg:py-12">
            {/* PAGE HEADER */}
            <header className="flex flex-col gap-6 border-b border-[#ead7ca] pb-9 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#ff6b4a]">
                  Business operations
                </p>

                <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                  Business{' '}
                  <span className="se-gradient-text">
                    Overview
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74675f] sm:text-base">
                  Review live bookings, revenue,
                  customers, active staff, and
                  appointment activity.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    '/admin/bookings'
                  )
                }
                className="se-btn-primary flex items-center justify-center gap-2 px-5 py-3 text-sm"
              >
                <CalendarDays size={18} />
                Manage Bookings
              </button>
            </header>

            {/* STATS */}
            <section className="grid border-b border-[#ead7ca] py-9 sm:grid-cols-2 xl:grid-cols-4">
              <div className="border-b border-[#ead7ca] py-5 sm:border-r sm:px-5 xl:border-b-0 xl:px-6 xl:first:pl-0">
                <div className="flex items-center gap-2 text-[#16845b]">
                  <CircleDollarSign size={17} />

                  <p className="text-xs font-bold uppercase tracking-[0.12em]">
                    Total Revenue
                  </p>
                </div>

                <p className="mt-3 text-3xl font-extrabold tracking-tight xl:text-4xl">
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

                <p className="mt-1 text-sm text-[#8b7c73]">
                  Paid payment records
                </p>
              </div>

              <div className="border-b border-[#ead7ca] py-5 sm:px-5 xl:border-b-0 xl:border-r xl:px-6">
                <div className="flex items-center gap-2 text-[#ff6b4a]">
                  <CalendarDays size={17} />

                  <p className="text-xs font-bold uppercase tracking-[0.12em]">
                    Total Bookings
                  </p>
                </div>

                <p className="mt-3 text-4xl font-extrabold">
                  {loadingStats
                    ? '...'
                    : totalBookings}
                </p>

                <p className="mt-1 text-sm text-[#8b7c73]">
                  All appointment records
                </p>
              </div>

              <div className="border-b border-[#ead7ca] py-5 sm:border-r sm:px-5 xl:border-b-0 xl:px-6">
                <div className="flex items-center gap-2 text-[#3569a6]">
                  <Users size={17} />

                  <p className="text-xs font-bold uppercase tracking-[0.12em]">
                    Customers
                  </p>
                </div>

                <p className="mt-3 text-4xl font-extrabold">
                  {loadingStats
                    ? '...'
                    : totalCustomers}
                </p>

                <p className="mt-1 text-sm text-[#8b7c73]">
                  Registered customers
                </p>
              </div>

              <div className="py-5 sm:px-5 xl:px-6 xl:pr-0">
                <div className="flex items-center gap-2 text-[#6c55aa]">
                  <Users size={17} />

                  <p className="text-xs font-bold uppercase tracking-[0.12em]">
                    Active Staff
                  </p>
                </div>

                <p className="mt-3 text-4xl font-extrabold">
                  {loadingStats
                    ? '...'
                    : activeStaff}
                </p>

                <p className="mt-1 text-sm text-[#8b7c73]">
                  Active staff profiles
                </p>
              </div>
            </section>

            {/* REVENUE + TODAY */}
            <section className="grid gap-12 border-b border-[#ead7ca] py-12 xl:grid-cols-[1.45fr_0.8fr]">
              {/* REVENUE */}
              <div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#16845b]">
                    Payments
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    Revenue Overview
                  </h2>

                  <p className="mt-2 text-sm text-[#74675f]">
                    Paid ServEase revenue during
                    the last six months.
                  </p>
                </div>

                <div className="mt-8 h-[320px]">
                  {loadingStats ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                        <p className="mt-4 text-sm text-[#8b7c73]">
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
                          stroke="#f0e1d7"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="month"
                          stroke="#8b7c73"
                          tickLine={false}
                          axisLine={false}
                          fontSize={12}
                        />

                        <YAxis
                          stroke="#8b7c73"
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
                              '#ffffff',
                            border:
                              '1px solid #ead7ca',
                            borderRadius:
                              '12px',
                            boxShadow:
                              '0 16px 35px rgba(28,20,16,0.12)',
                          }}
                          labelStyle={{
                            color:
                              '#493c35',
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#ff6b4a"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            fill: '#ff6b4a',
                            strokeWidth: 0,
                          }}
                          activeDot={{
                            r: 6,
                            fill: '#ffb020',
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* TODAY */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                  Today
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  Today's Appointments
                </h2>

                <p className="mt-2 text-sm text-[#74675f]">
                  Non-cancelled appointments
                  scheduled for today.
                </p>

                <div className="mt-6 divide-y divide-[#ead7ca] border-y border-[#ead7ca]">
                  {loadingStats ? (
                    <div className="flex min-h-[250px] items-center justify-center">
                      <p className="text-sm text-[#8b7c73]">
                        Loading appointments...
                      </p>
                    </div>
                  ) : todayAppointments.length ===
                    0 ? (
                    <div className="flex min-h-[250px] items-center justify-center text-center">
                      <div>
                        <CalendarDays
                          size={28}
                          className="mx-auto text-[#ff6b4a]"
                        />

                        <p className="mt-4 text-sm text-[#8b7c73]">
                          No appointments today
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
                          className="py-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold">
                                {appointment
                                  .service
                                  ?.name ??
                                  'Service'}
                              </p>

                              <p className="mt-1 text-sm text-[#74675f]">
                                {appointment
                                  .customer
                                  ?.full_name ??
                                  'Customer'}
                              </p>

                              <p className="mt-3 text-xs font-semibold text-[#8b7c73]">
                                {appointment.appointment_time.slice(
                                  0,
                                  5
                                )}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getAppointmentStatusStyle(
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

            {/* STATUS */}
            <section className="py-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                  Appointment analytics
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  Booking Status Overview
                </h2>

                <p className="mt-2 text-sm text-[#74675f]">
                  Distribution of real
                  appointment statuses in
                  ServEase.
                </p>
              </div>

              <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative h-[320px]">
                  {loadingStats ? (
                    <div className="flex h-full items-center justify-center text-sm text-[#8b7c73]">
                      Loading booking data...
                    </div>
                  ) : totalBookings === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-[#8b7c73]">
                      No booking data available
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
                                '#ffffff',
                              border:
                                '1px solid #ead7ca',
                              borderRadius:
                                '12px',
                            }}
                            labelStyle={{
                              color:
                                '#493c35',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-4xl font-extrabold">
                            {
                              totalBookings
                            }
                          </p>

                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#a09187]">
                            Bookings
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* FLAT STATUS LIST */}
                <div className="divide-y divide-[#ead7ca] border-y border-[#ead7ca]">
                  {bookingStatusData.map(
                    (status) => (
                      <div
                        key={status.name}
                        className="flex items-center justify-between py-5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                status.color,
                            }}
                          />

                          <p className="font-semibold">
                            {status.name}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-extrabold">
                            {loadingStats
                              ? '...'
                              : status.value}
                          </p>

                          <p className="mt-1 text-xs text-[#8b7c73]">
                            {totalBookings > 0
                              ? `${Math.round(
                                  (status.value /
                                    totalBookings) *
                                    100
                                )}% of bookings`
                              : '0% of bookings'}
                          </p>
                        </div>
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