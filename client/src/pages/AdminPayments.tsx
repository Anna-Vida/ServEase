import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  CirclePlus,
  CreditCard,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

type AppointmentOption = {
  id: string
  appointment_date: string
  customer: {
    full_name: string
  } | null
  service: {
    name: string
    price: number
  } | null
}

type Payment = {
  id: string
  amount: number
  payment_method: string | null
  payment_status: PaymentStatus
  paid_at: string | null
  created_at: string
  appointment: {
    appointment_date: string
    appointment_time: string
    customer: {
      full_name: string
    } | null
    service: {
      name: string
    } | null
  } | null
}

function AdminPayments() {
  const navigate = useNavigate()

  const [payments, setPayments] = useState<Payment[]>([])
  const [appointments, setAppointments] = useState<AppointmentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [appointmentId, setAppointmentId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>('pending')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [paymentsResult, appointmentsResult] = await Promise.all([
      supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_method,
          payment_status,
          paid_at,
          created_at,
          appointment:appointments (
            appointment_date,
            appointment_time,
            customer:profiles!appointments_customer_id_fkey (
              full_name
            ),
            service:services (
              name
            )
          )
        `)
        .order('created_at', { ascending: false }),

      supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          customer:profiles!appointments_customer_id_fkey (
            full_name
          ),
          service:services (
            name,
            price
          )
        `)
        .order('appointment_date', { ascending: false }),
    ])

    if (paymentsResult.error) {
      console.error(
        'Failed to load payments:',
        paymentsResult.error
      )
    } else {
      setPayments(
        (paymentsResult.data as unknown as Payment[]) ?? []
      )
    }

    if (appointmentsResult.error) {
      console.error(
        'Failed to load appointments:',
        appointmentsResult.error
      )
    } else {
      setAppointments(
        (appointmentsResult.data as unknown as AppointmentOption[]) ?? []
      )
    }

    setLoading(false)
  }

  const handleAppointmentChange = (id: string) => {
    setAppointmentId(id)

    const selectedAppointment = appointments.find(
      (appointment) => appointment.id === id
    )

    if (selectedAppointment?.service?.price !== undefined) {
      setAmount(String(selectedAppointment.service.price))
    } else {
      setAmount('')
    }
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!appointmentId) {
      return
    }

    const selectedAppointment = appointments.find(
      (appointment) => appointment.id === appointmentId
    )

    setSaving(true)

    const { data, error } = await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        amount: Number(amount),
        payment_method: paymentMethod || null,
        payment_status: paymentStatus,
        paid_at:
          paymentStatus === 'paid'
            ? new Date().toISOString()
            : null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create payment:', error)
      setSaving(false)
      return
    }

    await logAudit({
      action: 'payment_recorded',
      entityType: 'payment',
      entityId: data.id,
      details: {
        appointment_id: appointmentId,
        customer:
          selectedAppointment?.customer?.full_name ?? null,
        service:
          selectedAppointment?.service?.name ?? null,
        amount: Number(amount),
        payment_method: paymentMethod || null,
        payment_status: paymentStatus,
      },
    })

    setAppointmentId('')
    setAmount('')
    setPaymentMethod('')
    setPaymentStatus('pending')

    setSaving(false)

    await loadData()
  }

  const handleStatusChange = async (
    paymentId: string,
    newStatus: PaymentStatus
  ) => {
    const payment = payments.find(
      (currentPayment) => currentPayment.id === paymentId
    )

    if (!payment) {
      return
    }

    const previousStatus = payment.payment_status

    const { error } = await supabase
      .from('payments')
      .update({
        payment_status: newStatus,
        paid_at:
          newStatus === 'paid'
            ? new Date().toISOString()
            : null,
      })
      .eq('id', paymentId)

    if (error) {
      console.error(
        'Failed to update payment:',
        error
      )
      return
    }

    setPayments((currentPayments) =>
      currentPayments.map((currentPayment) =>
        currentPayment.id === paymentId
          ? {
              ...currentPayment,
              payment_status: newStatus,
              paid_at:
                newStatus === 'paid'
                  ? new Date().toISOString()
                  : null,
            }
          : currentPayment
      )
    )

    await logAudit({
      action: 'payment_status_changed',
      entityType: 'payment',
      entityId: paymentId,
      details: {
        previous_status: previousStatus,
        new_status: newStatus,
        amount: Number(payment.amount),
        payment_method: payment.payment_method,
        customer:
          payment.appointment?.customer?.full_name ?? null,
        service:
          payment.appointment?.service?.name ?? null,
      },
    })
  }

  const getStatusStyles = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'

      case 'failed':
        return 'border-red-500/20 bg-red-500/10 text-red-300'

      case 'refunded':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-300'

      default:
        return 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300'
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ChevronLeft size={18} />
          Back to dashboard
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
            <CreditCard size={24} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              ServEase
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Payments
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <CirclePlus
              size={20}
              className="text-emerald-300"
            />

            <h2 className="text-lg font-semibold">
              Record Payment
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-400">
                Appointment
              </label>

              <select
                required
                value={appointmentId}
                onChange={(event) =>
                  handleAppointmentChange(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="">
                  Select appointment
                </option>

                {appointments.map((appointment) => (
                  <option
                    key={appointment.id}
                    value={appointment.id}
                  >
                    {appointment.customer?.full_name ?? 'Customer'}
                    {' — '}
                    {appointment.service?.name ?? 'Service'}
                    {' — '}
                    {appointment.appointment_date}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400">
                Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="">
                  Select method
                </option>

                <option value="cash">
                  Cash
                </option>

                <option value="gcash">
                  GCash
                </option>

                <option value="maya">
                  Maya
                </option>

                <option value="bank_transfer">
                  Bank Transfer
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400">
                Payment Status
              </label>

              <select
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(
                    event.target.value as PaymentStatus
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
              >
                <option value="pending">
                  Pending
                </option>

                <option value="paid">
                  Paid
                </option>

                <option value="failed">
                  Failed
                </option>

                <option value="refunded">
                  Refunded
                </option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? 'Saving...'
              : 'Record Payment'}
          </button>
        </form>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {loading ? (
            <div className="p-8 text-slate-400">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-slate-400">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Service
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Method
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Paid
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-6 py-4">
                        {payment.appointment?.customer?.full_name ??
                          'Customer'}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {payment.appointment?.service?.name ??
                          'Service'}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        ₱
                        {Number(payment.amount).toLocaleString(
                          'en-PH',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>

                      <td className="px-6 py-4 capitalize text-slate-300">
                        {payment.payment_method
                          ? payment.payment_method.replace('_', ' ')
                          : '—'}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={payment.payment_status}
                          onChange={(event) =>
                            handleStatusChange(
                              payment.id,
                              event.target.value as PaymentStatus
                            )
                          }
                          className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize outline-none ${getStatusStyles(
                            payment.payment_status
                          )}`}
                        >
                          <option
                            value="pending"
                            className="bg-slate-900 text-white"
                          >
                            Pending
                          </option>

                          <option
                            value="paid"
                            className="bg-slate-900 text-white"
                          >
                            Paid
                          </option>

                          <option
                            value="failed"
                            className="bg-slate-900 text-white"
                          >
                            Failed
                          </option>

                          <option
                            value="refunded"
                            className="bg-slate-900 text-white"
                          >
                            Refunded
                          </option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {payment.paid_at
                          ? new Date(
                              payment.paid_at
                            ).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default AdminPayments