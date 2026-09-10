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

function AdminDashboard() {
  const navigate = useNavigate()

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
                  ₱84,250
                </p>

                <p className="mt-2 text-sm text-emerald-400">
                  +12.5% this month
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm text-slate-400">
                  Total Bookings
                </p>

                <p className="mt-3 text-3xl font-bold">
                  284
                </p>

                <p className="mt-2 text-sm text-indigo-400">
                  23 upcoming
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm text-slate-400">
                  Customers
                </p>

                <p className="mt-3 text-3xl font-bold">
                  156
                </p>

                <p className="mt-2 text-sm text-cyan-400">
                  +18 new
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <p className="text-sm text-slate-400">
                  Active Staff
                </p>

                <p className="mt-3 text-3xl font-bold">
                  12
                </p>

                <p className="mt-2 text-sm text-amber-400">
                  8 available today
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold">
                  Revenue Overview
                </h3>

                <div className="mt-6 flex h-72 items-center justify-center rounded-xl border border-dashed border-white/10 text-slate-500">
                  Chart will go here
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold">
                  Today&apos;s Appointments
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="font-medium">
                      Hair Treatment
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      10:00 AM · Maria Santos
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="font-medium">
                      Consultation
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      1:30 PM · John Reyes
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="font-medium">
                      Premium Service
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      4:00 PM · Ana Cruz
                    </p>
                  </div>
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