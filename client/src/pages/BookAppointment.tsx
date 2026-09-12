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
import { sendBookingConfirmation } from '../lib/api'

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

    const { data: booking, error } = await supabase
      .from('appointments')
      .insert({
        customer_id: user.id,
        service_id: serviceId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error || !booking) {
      setMessage(
        error?.message ||
          'Failed to create appointment.'
      )

      setLoading(false)
      return
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        await sendBookingConfirmation(
          booking.id,
          session.access_token
        )
      }
    } catch (notificationError) {
      console.error(
        'Appointment booked, but confirmation email failed:',
        notificationError
      )
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

  const formatCurrency = (
    value: number
  ) => {
    return `₱${Number(value).toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] text-[#1c1410]">
      {/* HEADER */}
      <header className="border-b border-[#f1ded0] bg-[#fff8f1]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <button
            type="button"
            onClick={() =>
              navigate('/customer')
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#74675f] transition hover:text-[#ff6b4a]"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
              <Sparkles size={17} />
            </div>

            <span className="text-sm font-extrabold">
              ServEase
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        {/* PAGE INTRO */}
        <section className="max-w-3xl">
          <p className="text-sm font-bold text-[#ff6b4a]">
            Appointment scheduling
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            Book an{' '}
            <span className="se-gradient-text">
              appointment
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#74675f]">
            Choose an active ServEase service,
            select your preferred date and time,
            and submit your booking request.
          </p>
        </section>

        <div className="mt-12 grid gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* FORM */}
          <section>
            <div className="border-b border-[#ead7ca] pb-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                Booking details
              </p>

              <h2 className="mt-2 text-2xl font-extrabold">
                Schedule your service
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#74675f]">
                Available services are loaded
                directly from ServEase.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-6"
            >
              {/* SERVICE */}
              <div>
                <label
                  htmlFor="service"
                  className="mb-2 block text-sm font-bold text-[#493c35]"
                >
                  Service
                </label>

                <div className="relative">
                  <Wrench
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#a09187]"
                  />

                  <select
                    id="service"
                    value={serviceId}
                    onChange={(event) =>
                      setServiceId(
                        event.target.value
                      )
                    }
                    required
                    disabled={servicesLoading}
                    className="se-input se-input-icon-left h-14 appearance-none pr-10"
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
                        >
                          {service.name} —{' '}
                          {formatCurrency(
                            service.price
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
                  <label
                    htmlFor="appointment-date"
                    className="mb-2 block text-sm font-bold text-[#493c35]"
                  >
                    Appointment Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#a09187]"
                    />

                    <input
                      id="appointment-date"
                      type="date"
                      value={appointmentDate}
                      min={today}
                      onChange={(event) =>
                        setAppointmentDate(
                          event.target.value
                        )
                      }
                      required
                      className="se-input se-input-icon-left h-14"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="appointment-time"
                    className="mb-2 block text-sm font-bold text-[#493c35]"
                  >
                    Appointment Time
                  </label>

                  <div className="relative">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#a09187]"
                    />

                    <input
                      id="appointment-time"
                      type="time"
                      value={appointmentTime}
                      onChange={(event) =>
                        setAppointmentTime(
                          event.target.value
                        )
                      }
                      required
                      className="se-input se-input-icon-left h-14"
                    />
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-bold text-[#493c35]"
                >
                  Notes
                </label>

                <div className="relative">
                  <FileText
                    size={18}
                    className="pointer-events-none absolute left-4 top-4 text-[#a09187]"
                  />

                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    rows={5}
                    placeholder="Optional notes for the business"
                    className="se-input se-input-icon-left min-h-32 resize-none py-4"
                  />
                </div>
              </div>

              {/* MESSAGE */}
              {message && (
                <div
                  className={
                    successMessage
                      ? 'flex items-start gap-3 rounded-xl border border-[#bfe7d6] bg-[#e9f8f1] px-4 py-3 text-sm text-[#16845b]'
                      : 'rounded-xl border border-[#f3c7bb] bg-[#fff0ec] px-4 py-3 text-sm text-[#c9472d]'
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

              <button
                type="submit"
                disabled={
                  loading ||
                  servicesLoading
                }
                className="se-btn-primary flex h-14 w-full items-center justify-center gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CalendarDays size={18} />
                    Book Appointment
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT SIDE */}
          <aside>
            <div className="border-b border-[#ead7ca] pb-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff8a3d]">
                Service details
              </p>

              <h2 className="mt-2 text-2xl font-extrabold">
                Your selection
              </h2>
            </div>

            {!selectedService ? (
              <div className="border-b border-[#ead7ca] py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0e7] text-[#ff6b4a]">
                  <Wrench size={21} />
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  Choose a service
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-[#74675f]">
                  Select one of the active ServEase
                  services to view its description,
                  price, and duration.
                </p>
              </div>
            ) : (
              <div className="border-b border-[#ead7ca] py-8">
                <h3 className="text-3xl font-extrabold tracking-tight">
                  {selectedService.name}
                </h3>

                <p className="mt-4 text-sm leading-7 text-[#74675f]">
                  {selectedService.description ||
                    'No service description available.'}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-6 border-t border-[#ead7ca] pt-6">
                  <div>
                    <div className="flex items-center gap-2 text-[#ff6b4a]">
                      <PhilippinePeso size={16} />

                      <span className="text-xs font-bold uppercase tracking-[0.1em]">
                        Price
                      </span>
                    </div>

                    <p className="mt-2 text-xl font-extrabold">
                      {formatCurrency(
                        selectedService.price
                      )}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#d98500]">
                      <Clock3 size={16} />

                      <span className="text-xs font-bold uppercase tracking-[0.1em]">
                        Duration
                      </span>
                    </div>

                    <p className="mt-2 text-xl font-extrabold">
                      {
                        selectedService.duration_minutes
                      }{' '}
                      min
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY */}
            <div className="pt-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                Booking summary
              </p>

              <div className="mt-5 divide-y divide-[#ead7ca] border-y border-[#ead7ca]">
                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-sm text-[#8b7c73]">
                    Service
                  </span>

                  <span className="max-w-[220px] text-right text-sm font-bold">
                    {selectedService?.name ||
                      'Not selected'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-sm text-[#8b7c73]">
                    Date
                  </span>

                  <span className="text-sm font-bold">
                    {appointmentDate ||
                      'Not selected'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-sm text-[#8b7c73]">
                    Time
                  </span>

                  <span className="text-sm font-bold">
                    {appointmentTime ||
                      'Not selected'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-sm text-[#8b7c73]">
                    Price
                  </span>

                  <span className="text-lg font-extrabold">
                    {selectedService
                      ? formatCurrency(
                          selectedService.price
                        )
                      : '—'}
                  </span>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-[#9b8b82]">
                Booking confirmation is sent after a
                successful appointment request when
                email delivery is available.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default BookAppointment