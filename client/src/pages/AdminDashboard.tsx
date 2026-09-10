import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

function AdminDashboard() {
  const navigate = useNavigate()

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [activeStaff, setActiveStaff] = useState(0)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
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
            .select('*', { count: 'exact', head: true }),

          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer'),

          supabase
            .from('staff_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),

          supabase
            .from('payments')
            .select('amount')
            .eq('payment_status', 'paid'),
        ])

        if (bookingsResult.error) {
          console.error('Bookings error:', bookingsResult.error)
        }

        if (customersResult.error) {
          console.error('Customers error:', customersResult.error)
        }

        if (staffResult.error) {
          console.error('Staff error:', staffResult.error)
        }

        if (paymentsResult.error) {
          console.error('Payments error:', paymentsResult.error)
        }

        setTotalBookings(bookingsResult.count ?? 0)
        setTotalCustomers(customersResult.count ?? 0)
        setActiveStaff(staffResult.count ?? 0)

        const revenue =
          paymentsResult.data?.reduce(
            (total, payment) => total + Number(payment.amount),
            0
          ) ?? 0

        setTotalRevenue(revenue)

        const today = new Date().toLocaleDateString('en-CA')

        const { data: appointmentsData, error: appointmentsError } =
          await supabase
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
            .order('appointment_time', { ascending: true })

        if (appointmentsError) {
          console.error(
            'Today appointments error:',
            appointmentsError
          )
        } else {
          setTodayAppointments(
            (appointmentsData as unknown as Appointment[]) ?? []
          )
        }
      } catch (error) {
        console.error('Dashboard stats error:', error)
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
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
            <button className="flex w-full items-center gap-3 rounded-xl bg-indigo-500/15 px-4 py-3 text-left text-indigo-300">
              <LayoutDashboard size={20} />
              Dashboard
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white">
              <CalendarDays size={20} />
              Bookings
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white">
              <Users size={20} />
              Customers
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white">
              <Users size={20} />
              Staff
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white">
              <Wrench size={20} />
              Services
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white">
              <CreditCard size={20} />
              Payments
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-400 transition hover:bg-white/5 hover:text-white">
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

              <button className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
                + New Booking
              </button>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm text-slate-400">
                  Total Revenue
                </p>

                <p className="mt-3 text-3xl font-bold">
                  {loadingStats
                    ? '...'
                    : `₱${totalRevenue.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
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
                  {loadingStats ? '...' : totalBookings}
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
                  {loadingStats ? '...' : totalCustomers}
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
                  {loadingStats ? '...' : activeStaff}
                </p>

                <p className="mt-2 text-sm text-amber-400">
                  Currently active
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold">
                  Revenue Overview
                </h3>

                <div className="mt-6 flex h-72 items-center justify-center rounded-xl border border-dashed border-white/10 text-slate-500">
                  Revenue chart coming next
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold">
                  Today&apos;s Appointments
                </h3>

                <div className="mt-5 space-y-3">
                  {loadingStats ? (
                    <p className="text-sm text-slate-500">
                      Loading appointments...
                    </p>
                  ) : todayAppointments.length === 0 ? (
                    <div className="flex h-60 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
                      No appointments today
                    </div>
                  ) : (
                    todayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-white">
                              {appointment.service?.name ??
                                'Service'}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {appointment.customer?.full_name ??
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
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))
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