import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function CustomerDashboard() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
              ServEase
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              Customer Dashboard
            </h1>

            <p className="mt-3 text-slate-400">
              Manage your appointments, services, and account activity.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  )
}

export default CustomerDashboard