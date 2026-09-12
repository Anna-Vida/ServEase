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
    <main className="min-h-screen bg-[#fff8f1] text-[#1c1410]">
      {/* Header */}
      <header className="border-b border-[#f1ded0] bg-[#fff8f1]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white shadow-[0_12px_30px_-12px_rgba(255,107,74,0.6)]">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight">
                ServEase
              </p>

              <p className="text-xs text-[#8b7c73]">
                Business Operations Platform
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 text-sm text-[#74675f] sm:flex">
            <ShieldCheck
              size={16}
              className="text-[#ff6b4a]"
            />
            Secure role-based access
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="relative overflow-hidden">
        {/* soft background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[8%] h-[360px] w-[360px] rounded-full bg-[#ffb020]/15 blur-3xl" />
          <div className="absolute right-[5%] top-20 h-[320px] w-[320px] rounded-full bg-[#ff6b4a]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          {/* Left content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0cdb8] bg-white/80 px-4 py-2 text-xs font-bold text-[#b95736] shadow-sm">
              <ShieldCheck size={15} />
              Secure business workspace
            </div>

            <h1 className="mt-7 text-5xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Manage your business{' '}
              <span className="se-gradient-text">
                with less friction.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#74675f] sm:text-lg">
              Sign in to manage bookings, customers,
              staff, services, payments, and day-to-day
              operations from one workspace.
            </p>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-[#ead7ca] pt-7">
              <div>
                <p className="text-sm font-bold text-[#1c1410]">
                  Customers
                </p>

                <p className="mt-1 text-sm text-[#8b7c73]">
                  Book and track appointments
                </p>
              </div>

              <div>
                <p className="text-sm font-bold text-[#1c1410]">
                  Staff
                </p>

                <p className="mt-1 text-sm text-[#8b7c73]">
                  Manage assigned bookings
                </p>
              </div>

              <div>
                <p className="text-sm font-bold text-[#1c1410]">
                  Admin
                </p>

                <p className="mt-1 text-sm text-[#8b7c73]">
                  Run business operations
                </p>
              </div>
            </div>
          </div>

          {/* Login area */}
          <div className="w-full max-w-md justify-self-end">
            <div className="mb-8">
              <p className="text-sm font-bold text-[#ff6b4a]">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Sign in to ServEase
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#74675f]">
                Enter your account details to continue
                to your dashboard.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-[#493c35]"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a09187]"
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
                    className="se-input se-input-icon-left h-14"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-[#493c35]"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a09187]"
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
                      setPassword(event.target.value)
                    }
                    required
                    autoComplete="current-password"
                    className="se-input se-input-icon-both h-14"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b7c73] transition hover:text-[#1c1410]"
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
                <div className="rounded-xl border border-[#f3c7bb] bg-[#fff0ec] px-4 py-3 text-sm text-[#b6412a]">
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="se-btn-primary mt-2 flex h-14 w-full items-center justify-center gap-2 px-6 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#ead7ca]" />

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a09187]">
                New to ServEase?
              </span>

              <div className="h-px flex-1 bg-[#ead7ca]" />
            </div>

            <Link
              to="/register"
              className="se-btn-secondary flex h-14 w-full items-center justify-center px-6 text-sm"
            >
              Create an account
            </Link>

            <p className="mt-7 text-center text-xs leading-5 text-[#9b8b82]">
              Your account access is protected by
              ServEase authentication and role-based
              permissions.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Login
