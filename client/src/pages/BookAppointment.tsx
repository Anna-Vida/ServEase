import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  PhilippinePeso,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

function BookAppointment() {
  const navigate = useNavigate()

  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [servicesLoading, setServicesLoading] = useState(true)

  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true)

      const { data, error } = await supabase
        .from('services')
        .select(
          'id, name, description, price, duration_minutes'
        )
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error(
          'Failed to load services:',
          error
        )

        setServices([])
        setServicesLoading(false)
        return
      }

      setServices(data ?? [])
      setServicesLoading(false)
    }

    loadServices()
  }, [])

  const selectedService = useMemo(() => {
    return (
      services.find(
        (service) =>
          service.id === serviceId
      ) ?? null
    )
  }, [services, serviceId])

  const today =
    new Date().toISOString().split('T')[0]

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage(
        'You must be logged in to book an appointment.'
      )
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('appointments')
      .insert({
        customer_id: user.id,
        service_id: serviceId,
        appointment_date:
          appointmentDate,
        appointment_time:
          appointmentTime,
        notes: notes || null,
      })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage(
      'Appointment booked successfully.'
    )

    setServiceId('')
    setAppointmentDate('')
    setAppointmentTime('')
    setNotes('')
    setLoading(false)
  }

  const successMessage =
    message ===
    'Appointment booked successfully.'

  return (
    <main className="se-page se-grid-bg relative min-h-screen overflow-hidden px-5 py-8 text-white sm:px-8 lg:px-10">
      {/* BACKGROUND GLOWS */}
      <div className="se-orb se-orb-indigo -left-32 top-16" />
      <div className="se-orb se-orb-cyan -right-20 top-24" />
      <div className="se-orb se-orb-violet bottom-[-120px] left-[42%]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() =>
              navigate('/customer')
            }
            className="se-btn-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <div className="se-badge hidden rounded-full px-4 py-2 text-xs sm:inline-flex">
            <Sparkles size={14} />
            ServEase Booking
          </div>
        </div>

        {/* PAGE HEADER */}
        <div className="mt-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">
            Appointment Scheduling
          </p>

          <h1 className="se-gradient-text mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Book an Appointment
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Choose an active ServEase service,
            select your preferred date and time,
            and submit your appointment request.
          </p>
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT - FORM */}
          <section className="se-glass rounded-[28px] p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
                Booking Details
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Schedule your service
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                All available services below are
                loaded directly from ServEase.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
              {/* SERVICE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Service
                </label>

                <div className="relative">
                  <Wrench
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                  />

                  <select
                    value={serviceId}
                    onChange={(event) =>
                      setServiceId(
                        event.target.value
                      )
                    }
                    required
                    disabled={
                      servicesLoading
                    }
                    className="se-input w-full appearance-none rounded-2xl py-3.5 pl-11 pr-10"
                  >
                    <option value="">
                      {servicesLoading
                        ? 'Loading services...'
                        : 'Select a service'}
                    </option>

                    {services.map(
                      (service) => (
                        <option
                          key={service.id}
                          value={service.id}
                          className="bg-slate-900 text-white"
                        >
                          {service.name} — ₱
                          {Number(
                            service.price
                          ).toLocaleString(
                            'en-PH'
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* DATE / TIME */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Appointment Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      type="date"
                      value={
                        appointmentDate
                      }
                      min={today}
                      onChange={(event) =>
                        setAppointmentDate(
                          event.target.value
                        )
                      }
                      required
                      className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Appointment Time
                  </label>

                  <div className="relative">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      type="time"
                      value={
                        appointmentTime
                      }
                      onChange={(event) =>
                        setAppointmentTime(
                          event.target.value
                        )
                      }
                      required
                      className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4"
                    />
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Notes
                </label>

                <div className="relative">
                  <FileText
                    size={18}
                    className="pointer-events-none absolute left-4 top-4 text-slate-500"
                  />

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    rows={5}
                    placeholder="Optional notes for the business"
                    className="se-input w-full resize-none rounded-2xl py-3.5 pl-11 pr-4"
                  />
                </div>
              </div>

              {/* MESSAGE */}
              {message && (
                <div
                  className={
                    successMessage
                      ? 'flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300'
                      : 'rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300'
                  }
                >
                  {successMessage && (
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                  )}

                  <span>{message}</span>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={
                  loading ||
                  servicesLoading
                }
                className="se-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CalendarDays
                      size={18}
                    />
                    Book Appointment
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT - LIVE SERVICE PREVIEW */}
          <aside className="space-y-5">
            <div className="se-glass se-card-3d rounded-[28px] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Selected Service
              </p>

              {!selectedService ? (
                <div className="mt-8 text-center">
                  <div className="se-icon-box mx-auto h-16 w-16 rounded-3xl text-indigo-300">
                    <Wrench size={27} />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    Choose a service
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Select one of the active
                    ServEase services to see its
                    details here.
                  </p>
                </div>
              ) : (
                <div className="mt-7">
                  <h3 className="text-2xl font-bold text-white">
                    {
                      selectedService.name
                    }
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {selectedService.description ||
                      'No service description available.'}
                  </p>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <div className="flex items-center gap-3">
                        <div className="se-icon-box h-10 w-10 rounded-xl text-emerald-300">
                          <PhilippinePeso
                            size={18}
                          />
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Price
                          </p>

                          <p className="mt-1 font-semibold">
                            ₱
                            {Number(
                              selectedService.price
                            ).toLocaleString(
                              'en-PH',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <div className="flex items-center gap-3">
                        <div className="se-icon-box h-10 w-10 rounded-xl text-cyan-300">
                          <Clock3 size={18} />
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Duration
                          </p>

                          <p className="mt-1 font-semibold">
                            {
                              selectedService.duration_minutes
                            }{' '}
                            minutes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOOKING SUMMARY */}
            <div className="se-glass rounded-[28px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                Booking Summary
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <span className="text-sm text-slate-500">
                    Service
                  </span>

                  <span className="max-w-[220px] text-right text-sm font-medium text-slate-200">
                    {selectedService?.name ||
                      'Not selected'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <span className="text-sm text-slate-500">
                    Date
                  </span>

                  <span className="text-sm font-medium text-slate-200">
                    {appointmentDate ||
                      'Not selected'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <span className="text-sm text-slate-500">
                    Time
                  </span>

                  <span className="text-sm font-medium text-slate-200">
                    {appointmentTime ||
                      'Not selected'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Price
                  </span>

                  <span className="text-lg font-bold text-white">
                    {selectedService
                      ? `₱${Number(
                          selectedService.price
                        ).toLocaleString(
                          'en-PH',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default BookAppointment