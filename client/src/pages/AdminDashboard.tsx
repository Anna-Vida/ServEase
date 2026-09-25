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

            <section className="grid gap-4 py-9 sm:grid-cols-2 xl:grid-cols-4">

              {/* TOTAL REVENUE */}

              <article className="relative overflow-hidden rounded-2xl bg-[#1c1410] p-6 text-white shadow-[0_10px_28px_rgba(28,20,16,0.10)]">

                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.06]" />

                <div className="pointer-events-none absolute right-8 top-10 h-14 w-14 rounded-full bg-white/[0.05]" />



                <div className="relative z-10">

                  <div className="flex items-center gap-2 text-white/75">

                    <CircleDollarSign size={17} />



                    <p className="text-xs font-bold uppercase tracking-[0.12em]">

                      Total Revenue

                    </p>

                  </div>



                  <p className="mt-5 text-3xl font-extrabold tracking-[-0.04em] xl:text-4xl">

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



                  <div className="mt-5 border-t border-white/10 pt-3">

                    <p className="text-xs text-white/65">

                      Paid payment records

                    </p>

                  </div>

                </div>

              </article>



              {/* TOTAL BOOKINGS */}

              <article className="relative overflow-hidden rounded-2xl bg-[#ff6b4a] p-6 text-white shadow-[0_10px_28px_rgba(255,107,74,0.15)]">

                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.10]" />

                <div className="pointer-events-none absolute right-10 top-12 h-12 w-12 rounded-full bg-white/[0.08]" />



                <div className="relative z-10">

                  <div className="flex items-center gap-2 text-white/85">

                    <CalendarDays size={17} />



                    <p className="text-xs font-bold uppercase tracking-[0.12em]">

                      Total Bookings

                    </p>

                  </div>



                  <p className="mt-5 text-4xl font-extrabold tracking-[-0.04em]">

                    {loadingStats

                      ? '...'

                      : totalBookings}

                  </p>



                  <div className="mt-5 border-t border-white/20 pt-3">

                    <p className="text-xs text-white/80">

                      All appointment records

                    </p>

                  </div>

                </div>

              </article>



              {/* CUSTOMERS */}

              <article className="relative overflow-hidden rounded-2xl bg-[#ff8a3d] p-6 text-white shadow-[0_10px_28px_rgba(255,138,61,0.15)]">

                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.12]" />

                <div className="pointer-events-none absolute right-10 top-12 h-12 w-12 rounded-full bg-white/[0.08]" />



                <div className="relative z-10">

                  <div className="flex items-center gap-2 text-white/85">

                    <Users size={17} />



                    <p className="text-xs font-bold uppercase tracking-[0.12em]">

                      Customers

                    </p>

                  </div>



                  <p className="mt-5 text-4xl font-extrabold tracking-[-0.04em]">

                    {loadingStats

                      ? '...'

                      : totalCustomers}

                  </p>



                  <div className="mt-5 border-t border-white/20 pt-3">

                    <p className="text-xs text-white/80">

                      Registered customers

                    </p>

                  </div>

                </div>

              </article>



              {/* ACTIVE STAFF */}

              <article className="relative overflow-hidden rounded-2xl bg-[#16845b] p-6 text-white shadow-[0_10px_28px_rgba(22,132,91,0.14)]">

                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.10]" />

                <div className="pointer-events-none absolute right-10 top-12 h-12 w-12 rounded-full bg-white/[0.07]" />



                <div className="relative z-10">

                  <div className="flex items-center gap-2 text-white/80">

                    <Users size={17} />



                    <p className="text-xs font-bold uppercase tracking-[0.12em]">

                      Active Staff

                    </p>

                  </div>



                  <p className="mt-5 text-4xl font-extrabold tracking-[-0.04em]">

                    {loadingStats

                      ? '...'

                      : activeStaff}

                  </p>



                  <div className="mt-5 border-t border-white/15 pt-3">

                    <p className="text-xs text-white/70">

                      Active staff profiles

                    </p>

                  </div>

                </div>

              </article>

            </section>



            {/* REVENUE + TODAY */}
            <section className="grid gap-6 border-b border-[#ead7ca] py-10 xl:grid-cols-[1.45fr_0.8fr]">
              {/* REVENUE CARD */}
              <article className="overflow-hidden rounded-2xl border border-[#ead7ca] bg-[#fffaf5]">
                <div className="flex flex-col gap-4 border-b border-[#ead7ca] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#16845b]">
                      Payments
                    </p>

                    <h2 className="mt-2 text-2xl font-extrabold">
                      Revenue Overview
                    </h2>

                    <p className="mt-2 text-sm text-[#74675f]">
                      Paid ServEase revenue during the last six months.
                    </p>
                  </div>

                  <span className="self-start rounded-full border border-[#ead7ca] bg-white px-3 py-1.5 text-xs font-semibold text-[#8b7c73] sm:self-auto">
                    Last 6 months
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="h-[340px]">
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
                            top: 18,
                            right: 18,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <filter
                              id="servease-revenue-glow"
                              x="-30%"
                              y="-30%"
                              width="160%"
                              height="160%"
                            >
                              <feGaussianBlur
                                stdDeviation="5"
                                result="blur"
                              />
                              <feFlood
                                floodColor="#ff6b4a"
                                floodOpacity="0.28"
                                result="glowColor"
                              />
                              <feComposite
                                in="glowColor"
                                in2="blur"
                                operator="in"
                                result="softGlow"
                              />
                              <feMerge>
                                <feMergeNode in="softGlow" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          <CartesianGrid
                            strokeDasharray="4 6"
                            stroke="#f0e1d7"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="month"
                            stroke="#8b7c73"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            fontSize={12}
                          />

                          <YAxis
                            stroke="#8b7c73"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            fontSize={12}
                            tickFormatter={(value) =>
                              `₱${Number(
                                value
                              ).toLocaleString(
                                'en-PH'
                              )}`
                            }
                          />

                          <Tooltip
                            cursor={{
                              stroke: '#ead7ca',
                              strokeDasharray: '4 4',
                            }}
                            formatter={(value) => [
                              formatCurrency(
                                Number(value)
                              ),
                              'Revenue',
                            ]}
                            contentStyle={{
                              background:
                                '#fffaf5',
                              border:
                                '1px solid #ead7ca',
                              borderRadius:
                                '12px',
                              boxShadow:
                                '0 12px 28px rgba(28,20,16,0.10)',
                            }}
                            labelStyle={{
                              color:
                                '#493c35',
                            }}
                            itemStyle={{
                              color:
                                '#ff6b4a',
                            }}
                          />

                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#ff6b4a"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{
                              r: 6,
                              fill: '#ffb020',
                              stroke:
                                '#fff8f1',
                              strokeWidth: 3,
                            }}
                            filter="url(#servease-revenue-glow)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </article>

              {/* TODAY CARD */}
              <article className="overflow-hidden rounded-2xl border border-[#ead7ca] bg-[#fffaf5]">
                <div className="flex items-start justify-between gap-4 border-b border-[#ead7ca] px-5 py-5 sm:px-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                      Today
                    </p>

                    <h2 className="mt-2 text-2xl font-extrabold">
                      Today's Appointments
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#74675f]">
                      Non-cancelled appointments scheduled for today.
                    </p>
                  </div>

                  {!loadingStats && (
                    <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[#ead7ca] bg-white px-3.5 py-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0e7] text-[#ff6b4a]">
                        <CalendarDays size={17} />
                      </div>

                      <div>
                        <p className="text-xl font-extrabold leading-none tracking-[-0.04em] text-[#1c1410]">
                          {todayAppointments.length}
                        </p>

                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                          Scheduled today
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-h-[340px]">
                  {loadingStats ? (
                    <div className="flex min-h-[340px] items-center justify-center px-6">
                      <div className="text-center">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                        <p className="mt-4 text-sm text-[#8b7c73]">
                          Loading appointments...
                        </p>
                      </div>
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden px-6 text-center">
                      <div
                        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#ff6b4a]/[0.05]"
                        aria-hidden="true"
                      />

                      <div
                        className="pointer-events-none absolute -bottom-14 -left-14 h-40 w-40 rounded-full bg-[#ffb020]/[0.06]"
                        aria-hidden="true"
                      />

                      <div className="relative z-10 max-w-[290px]">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f4c9b7] bg-[#fff0e7] text-[#ff6b4a]">
                          <CalendarDays size={24} />
                        </div>

                        <p className="mt-5 text-base font-bold text-[#1c1410]">
                          No appointments today
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#8b7c73]">
                          Your schedule is clear for today. New confirmed
                          appointments will appear here.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            navigate('/admin/bookings')
                          }
                          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#c45231] transition hover:text-[#a93f29]"
                        >
                          View all bookings
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#ead7ca]">
                      {todayAppointments.map(
                        (appointment) => (
                          <article
                            key={appointment.id}
                            className="px-5 py-4 transition-colors hover:bg-white sm:px-6"
                          >
                            <div className="grid gap-4 sm:grid-cols-[78px_1fr_auto] sm:items-center">
                              <div>
                                <p className="text-lg font-extrabold tracking-[-0.03em] text-[#1c1410]">
                                  {appointment.appointment_time.slice(
                                    0,
                                    5
                                  )}
                                </p>

                                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                                  Time
                                </p>
                              </div>

                              <div className="min-w-0 border-l border-[#ead7ca] pl-4">
                                <p className="truncate font-bold text-[#1c1410]">
                                  {appointment.service?.name ??
                                    'Service'}
                                </p>

                                <p className="mt-1 truncate text-sm text-[#74675f]">
                                  {appointment.customer?.full_name ??
                                    'Customer'}
                                </p>
                              </div>

                              <span
                                className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getAppointmentStatusStyle(
                                  appointment.status
                                )}`}
                              >
                                {appointment.status}
                              </span>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </div>
              </article>
            </section>



            {/* STATUS */}
            <section className="py-10">
              <article className="overflow-hidden rounded-2xl border border-[#ead7ca] bg-[#fffaf5]">
                {/* HEADER */}
                <div className="flex flex-col gap-4 border-b border-[#ead7ca] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                      Appointment analytics
                    </p>

                    <h2 className="mt-2 text-2xl font-extrabold">
                      Booking Status Overview
                    </h2>

                    <p className="mt-2 text-sm text-[#74675f]">
                      Distribution of real appointment statuses in ServEase.
                    </p>
                  </div>

                  <div className="flex self-start items-center gap-3 rounded-xl border border-[#ead7ca] bg-white px-3.5 py-2.5 sm:self-auto">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0e7] text-[#ff6b4a]">
                      <CalendarDays size={17} />
                    </div>

                    <div>
                      <p className="text-xl font-extrabold leading-none tracking-[-0.04em] text-[#1c1410]">
                        {loadingStats
                          ? '...'
                          : totalBookings}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a09187]">
                        Total bookings
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
                  {/* PIE CHART */}
                  <div className="relative min-h-[360px] border-b border-[#ead7ca] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                    {loadingStats ? (
                      <div className="flex h-[320px] items-center justify-center text-sm text-[#8b7c73]">
                        Loading booking data...
                      </div>
                    ) : totalBookings === 0 ? (
                      <div className="flex h-[320px] items-center justify-center text-sm text-[#8b7c73]">
                        No booking data available
                      </div>
                    ) : (
                      <>
                        <div className="h-[320px]">
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
                                innerRadius={80}
                                outerRadius={122}
                                paddingAngle={4}
                              >
                                {bookingStatusData.map(
                                  (entry) => (
                                    <Cell
                                      key={entry.name}
                                      fill={entry.color}
                                      stroke="#fffaf5"
                                      strokeWidth={3}
                                    />
                                  )
                                )}
                              </Pie>

                              <Tooltip
                                formatter={(value) => [
                                  Number(value),
                                  'Bookings',
                                ]}
                                contentStyle={{
                                  background:
                                    '#fffaf5',
                                  border:
                                    '1px solid #ead7ca',
                                  borderRadius:
                                    '12px',
                                  boxShadow:
                                    '0 12px 28px rgba(28,20,16,0.10)',
                                }}
                                labelStyle={{
                                  color:
                                    '#493c35',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-4xl font-extrabold tracking-[-0.05em] text-[#1c1410]">
                              {totalBookings}
                            </p>

                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#a09187]">
                              Bookings
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* STATUS STAT CARDS */}
                  <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                    {bookingStatusData.map(
                      (status) => {
                        const percentage =
                          totalBookings > 0
                            ? Math.round(
                                (status.value /
                                  totalBookings) *
                                  100
                              )
                            : 0

                        const styles =
                          status.name ===
                          'Pending'
                            ? {
                                card:
                                  'border-[#f4dda5] bg-[#fff8e8]',
                                dot:
                                  'bg-[#ffb020]',
                                value:
                                  'text-[#a76800]',
                                bar:
                                  'bg-[#ffb020]',
                              }
                            : status.name ===
                                'Confirmed'
                              ? {
                                  card:
                                    'border-[#cfe1f5] bg-[#f3f8fe]',
                                  dot:
                                    'bg-[#6e9ed2]',
                                  value:
                                    'text-[#3569a6]',
                                  bar:
                                    'bg-[#6e9ed2]',
                                }
                              : status.name ===
                                  'Completed'
                                ? {
                                    card:
                                      'border-[#bfe7d6] bg-[#eff9f4]',
                                    dot:
                                      'bg-[#43a77b]',
                                    value:
                                      'text-[#16845b]',
                                    bar:
                                      'bg-[#43a77b]',
                                  }
                                : {
                                    card:
                                      'border-[#f3c7bb] bg-[#fff2ee]',
                                    dot:
                                      'bg-[#df6b56]',
                                    value:
                                      'text-[#c9472d]',
                                    bar:
                                      'bg-[#df6b56]',
                                  }

                        return (
                          <div
                            key={status.name}
                            className={`relative overflow-hidden rounded-2xl border p-5 ${styles.card}`}
                          >
                            <div
                              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/35"
                              aria-hidden="true"
                            />

                            <div className="relative z-10">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                                  />

                                  <p className="text-sm font-bold text-[#493c35]">
                                    {status.name}
                                  </p>
                                </div>

                                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-[#8b7c73]">
                                  {percentage}%
                                </span>
                              </div>

                              <div className="mt-6 flex items-end justify-between gap-4">
                                <p
                                  className={`text-4xl font-extrabold tracking-[-0.05em] ${styles.value}`}
                                >
                                  {loadingStats
                                    ? '...'
                                    : status.value}
                                </p>

                                <p className="pb-1 text-xs text-[#8b7c73]">
                                  of {totalBookings}
                                </p>
                              </div>

                              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/80">
                                <div
                                  className={`h-full rounded-full ${styles.bar}`}
                                  style={{
                                    width:
                                      `${percentage}%`,
                                  }}
                                />
                              </div>

                              <p className="mt-3 text-xs text-[#8b7c73]">
                                {percentage}% of all bookings
                              </p>
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>
              </article>
            </section>



          </div>



        </section>



      </div>



    </main>



  )



}







export default AdminDashboard