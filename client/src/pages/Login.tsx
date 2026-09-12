import { useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      setMessage(
        'Could not load your account role.'
      )
      setLoading(false)
      return
    }

    if (profile.role === 'admin') {
      navigate('/admin')
    } else if (profile.role === 'staff') {
      navigate('/staff')
    } else {
      navigate('/customer')
    }

    setLoading(false)
  }

  return (
    <main className="se-page se-grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      {/* Background glow effects */}
      <div className="se-orb se-orb-indigo -left-28 -top-20" />

      <div className="se-orb se-orb-cyan -right-20 top-24" />

      <div className="se-orb se-orb-violet bottom-[-120px] left-[45%]" />

      {/* Decorative light */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/45 shadow-[0_40px_120px_rgba(2,6,23,0.7)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT SIDE */}
        <section className="relative hidden min-h-[680px] overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
          {/* Internal glow */}
          <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-[100px]" />

          <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="se-icon-box h-11 w-11 rounded-2xl text-indigo-300">
                <Sparkles size={21} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-300">
                  ServEase
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Business Operations Platform
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <div className="se-badge rounded-full px-4 py-2 text-xs">
                <ShieldCheck
                  size={15}
                  className="text-emerald-300"
                />
                Secure role-based workspace
              </div>

              <h1 className="se-gradient-text mt-7 text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
                Run your service business from one place.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Manage customers, bookings, staff,
                payments, analytics, and operational
                activity with a modern workflow built
                for everyday business operations.
              </p>
            </div>

            {/* Floating 3D preview cards */}
            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="se-glass se-card-3d rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Operations
                </p>

                <p className="mt-3 text-2xl font-bold text-white">
                  Unified
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Bookings, staff, and services
                </p>
              </div>

              <div className="se-glass se-card-3d translate-y-6 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Insights
                </p>

                <p className="mt-3 text-2xl font-bold text-white">
                  Live
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Revenue and booking analytics
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
            ServEase systems ready
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="relative flex min-h-[680px] items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-md se-fade-up">
            <div className="lg:hidden">
              <div className="flex items-center gap-3">
                <div className="se-icon-box h-11 w-11 rounded-2xl text-indigo-300">
                  <Sparkles size={21} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
                    ServEase
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Business Operations Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <p className="text-sm font-medium text-indigo-300">
                Welcome back
              </p>

              <h2 className="se-gradient-text mt-3 text-4xl font-bold tracking-tight">
                Sign in to your workspace
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Access your dashboard and continue
                managing ServEase.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="mt-9 space-y-5"
            >
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                    autoComplete="email"
                    className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    required
                    autoComplete="current-password"
                    className="se-input w-full rounded-2xl py-3.5 pl-11 pr-12"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {message && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-xl">
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="se-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">
                New here?
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Link
              to="/register"
              className="se-btn-secondary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-medium"
            >
              Create an account
            </Link>

            <p className="mt-8 text-center text-xs leading-5 text-slate-600">
              By signing in, you are accessing the
              ServEase business operations platform.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
