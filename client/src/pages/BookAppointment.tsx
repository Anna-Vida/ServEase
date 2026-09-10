import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

function BookAppointment() {
  const [services, setServices] = useState<Service[]>([])
  const [serviceId, setServiceId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, duration_minutes')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Failed to load services:', error)
        return
      }

      setServices(data ?? [])
    }

    loadServices()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('You must be logged in to book an appointment.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('appointments')
      .insert({
        customer_id: user.id,
        service_id: serviceId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        notes: notes || null,
      })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Appointment booked successfully.')
    setServiceId('')
    setAppointmentDate('')
    setAppointmentTime('')
    setNotes('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
          ServEase
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Book an Appointment
        </h1>

        <p className="mt-3 text-slate-400">
          Choose a service, date, and time that works for you.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Service
            </label>

            <select
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            >
              <option value="">Select a service</option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — ₱{Number(service.price).toLocaleString('en-PH')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Date
            </label>

            <input
              type="date"
              value={appointmentDate}
              onChange={(event) => setAppointmentDate(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Time
            </label>

            <input
              type="time"
              value={appointmentTime}
              onChange={(event) => setAppointmentTime(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Optional notes for the business"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>

          {message && (
            <p className="rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}

export default BookAppointment