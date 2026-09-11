import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        'Registration successful. Check your email to confirm your account.'
      )

      setFullName('')
      setEmail('')
      setPassword('')
    }

    setLoading(false)
  }

  const messageIsSuccess =
    message.toLowerCase().includes('successful')

  return (
    <main className="se-page se-grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="se-orb se-orb-violet -left-24 top-20" />
      <div className="se-orb se-orb-cyan -right-24 -top-10" />
      <div className="se-orb se-orb-indigo bottom-[-130px] left-[38%]" />

      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/45 shadow-[0_40px_120px_rgba(2,6,23,0.7)] backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr]">
        {/* LEFT SIDE - FORM */}
        <section className="relative flex min-h-[720px] items-center justify-center border-r border-white/10 px-6 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-md se-fade-up">
            <Link
              to="/login"
              className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              Back to sign in
            </Link>

            <div className="lg:hidden">
              <div className="flex items-center gap-3">
                <div className="se-icon-box h-11 w-11 rounded-2xl text-violet-300">
                  <Sparkles size={21} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
                    ServEase
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Business Operations Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="text-sm font-medium text-violet-300">
                Customer registration
              </p>

              <h1 className="se-gradient-text mt-3 text-4xl font-bold tracking-tight">
                Create your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Create your ServEase customer account to book
                available services and manage your appointments.
              </p>
            </div>

            <form
              onSubmit={handleRegister}
              className="mt-9 space-y-5"
            >
              {/* FULL NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full name
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    required
                    autoComplete="name"
                    className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4"
                    placeholder="Anna Vida"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
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

              {/* PASSWORD */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">
                    Password
                  </label>

                  <span className="text-xs text-slate-600">
                    Minimum 6 characters
                  </span>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
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
                    minLength={6}
                    autoComplete="new-password"
                    className="se-input w-full rounded-2xl py-3.5 pl-11 pr-12"
                    placeholder="Create a secure password"
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

              {/* MESSAGE */}
              {message && (
                <div
                  className={
                    messageIsSuccess
                      ? 'rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 backdrop-blur-xl'
                      : 'rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-xl'
                  }
                >
                  {message}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="se-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">
                Already registered?
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Link
              to="/login"
              className="se-btn-secondary flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-medium"
            >
              Sign in instead
            </Link>
          </div>
        </section>

        {/* RIGHT SIDE - REAL SERVEASE FEATURES */}
        <section className="relative hidden min-h-[720px] overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-violet-500/20 blur-[110px]" />

          <div className="absolute bottom-20 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="se-icon-box h-11 w-11 rounded-2xl text-violet-300">
                <Sparkles size={21} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-300">
                  ServEase
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Business Operations Platform
                </p>
              </div>
            </div>

            <div className="mt-24">
              <div className="se-badge rounded-full px-4 py-2 text-xs">
                <ShieldCheck
                  size={15}
                  className="text-emerald-300"
                />
                Connected to ServEase customer workflows
              </div>

              <h2 className="se-gradient-text mt-7 max-w-xl text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
                Book, track, and manage your services.
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Create your ServEase account to book available
                services, track appointment status, see assigned
                staff, and monitor payment activity from one
                customer dashboard.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="se-glass se-card-3d rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Booking
                </p>

                <p className="mt-3 text-2xl font-bold">
                  Schedule
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Select an active service, appointment date,
                  and time
                </p>
              </div>

              <div className="se-glass se-card-3d translate-y-6 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Dashboard
                </p>

                <p className="mt-3 text-2xl font-bold">
                  Track
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  View assigned staff, booking status, and
                  payment status
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
            Customer registration available
          </div>
        </section>
      </div>
    </main>
  )
}

export default Register