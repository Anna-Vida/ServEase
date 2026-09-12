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
    <main className="min-h-screen bg-[#fff8f1] text-[#1c1410]">
      {/* HEADER */}
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

          <Link
            to="/login"
            className="hidden items-center gap-2 text-sm font-semibold text-[#74675f] transition hover:text-[#ff6b4a] sm:flex"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <section className="relative overflow-hidden">
        {/* Background accents */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[7%] h-[380px] w-[380px] rounded-full bg-[#ffb020]/15 blur-3xl" />

          <div className="absolute right-[4%] top-16 h-[340px] w-[340px] rounded-full bg-[#ff6b4a]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          {/* LEFT — FORM */}
          <div className="w-full max-w-md">
            <Link
              to="/login"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#8b7c73] transition hover:text-[#ff6b4a] sm:hidden"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>

            <p className="text-sm font-bold text-[#ff6b4a]">
              Customer registration
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              Create your account
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#74675f]">
              Create your ServEase customer account to
              book services and manage your appointments
              from one place.
            </p>

            <form
              onSubmit={handleRegister}
              className="mt-9 space-y-5"
            >
              {/* NAME */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-bold text-[#493c35]"
                >
                  Full name
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a09187]"
                  />

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    required
                    autoComplete="name"
                    className="se-input se-input-icon-left h-14"
                    placeholder="Anna Vida"
                  />
                </div>
              </div>

              {/* EMAIL */}
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

              {/* PASSWORD */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-[#493c35]"
                  >
                    Password
                  </label>

                  <span className="text-xs text-[#a09187]">
                    Minimum 6 characters
                  </span>
                </div>

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
                    minLength={6}
                    autoComplete="new-password"
                    className="se-input se-input-icon-both h-14"
                    placeholder="Create a secure password"
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

              {/* MESSAGE */}
              {message && (
                <div
                  className={
                    messageIsSuccess
                      ? 'rounded-xl border border-[#bfe7d6] bg-[#e9f8f1] px-4 py-3 text-sm text-[#16845b]'
                      : 'rounded-xl border border-[#f3c7bb] bg-[#fff0ec] px-4 py-3 text-sm text-[#b6412a]'
                  }
                >
                  {message}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="se-btn-primary mt-2 flex h-14 w-full items-center justify-center gap-2 px-6 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#ead7ca]" />

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a09187]">
                Already registered?
              </span>

              <div className="h-px flex-1 bg-[#ead7ca]" />
            </div>

            <Link
              to="/login"
              className="se-btn-secondary flex h-14 w-full items-center justify-center px-6 text-sm"
            >
              Sign in instead
            </Link>
          </div>

          {/* RIGHT — PRODUCT CONTENT */}
          <div className="max-w-2xl lg:justify-self-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0cdb8] bg-white/80 px-4 py-2 text-xs font-bold text-[#b95736] shadow-sm">
              <ShieldCheck size={15} />
              Built for real customer workflows
            </div>

            <h2 className="mt-7 text-5xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              Your services,
              <br />
              appointments, and{' '}
              <span className="se-gradient-text">
                updates.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#74675f] sm:text-lg">
              ServEase gives customers a simple place
              to schedule services, monitor their
              appointments, see assigned staff, and
              review payment activity.
            </p>

            {/* NOT BENTO — FLAT FEATURE ROWS */}
            <div className="mt-10 border-y border-[#ead7ca]">
              <div className="grid gap-4 border-b border-[#ead7ca] py-6 sm:grid-cols-[140px_1fr]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                    01
                  </span>

                  <p className="mt-1 font-bold">
                    Book
                  </p>
                </div>

                <p className="text-sm leading-7 text-[#74675f]">
                  Select an available service, choose
                  your preferred date and time, and add
                  appointment notes.
                </p>
              </div>

              <div className="grid gap-4 border-b border-[#ead7ca] py-6 sm:grid-cols-[140px_1fr]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a3d]">
                    02
                  </span>

                  <p className="mt-1 font-bold">
                    Track
                  </p>
                </div>

                <p className="text-sm leading-7 text-[#74675f]">
                  Check whether your appointment is
                  pending, confirmed, completed, or
                  cancelled and see your assigned staff.
                </p>
              </div>

              <div className="grid gap-4 py-6 sm:grid-cols-[140px_1fr]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#d98500]">
                    03
                  </span>

                  <p className="mt-1 font-bold">
                    Manage
                  </p>
                </div>

                <p className="text-sm leading-7 text-[#74675f]">
                  Review your bookings and payment
                  information from your ServEase
                  customer dashboard.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-[#ff6b4a]">
                <ShieldCheck size={17} />
              </div>

              <div>
                <p className="text-sm font-bold">
                  Secure customer access
                </p>

                <p className="mt-1 text-sm leading-6 text-[#74675f]">
                  Customer accounts use ServEase
                  authentication and role-based access
                  controls.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Register
