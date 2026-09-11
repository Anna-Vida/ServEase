import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  CircleDollarSign,
  CirclePlus,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PhilippinePeso,
  Search,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'

type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'

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

type NavItem = {
  label: string
  path: string
  icon: React.ElementType
}

function AdminPayments() {
  const navigate = useNavigate()

  const [payments, setPayments] =
    useState<Payment[]>([])

  const [appointments, setAppointments] =
    useState<AppointmentOption[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [updatingId, setUpdatingId] =
    useState<string | null>(null)

  const [appointmentId, setAppointmentId] =
    useState('')

  const [amount, setAmount] =
    useState('')

  const [paymentMethod, setPaymentMethod] =
    useState('')

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState<PaymentStatus>('pending')

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [methodFilter, setMethodFilter] =
    useState('all')

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Bookings',
      path: '/admin/bookings',
      icon: CalendarDays,
    },
    {
      label: 'Customers',
      path: '/admin/customers',
      icon: Users,
    },
    {
      label: 'Staff',
      path: '/admin/staff',
      icon: Users,
    },
    {
      label: 'Services',
      path: '/admin/services',
      icon: Wrench,
    },
    {
      label: 'Payments',
      path: '/admin/payments',
      icon: CreditCard,
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: Activity,
    },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [
      paymentsResult,
      appointmentsResult,
    ] = await Promise.all([
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
        .order('created_at', {
          ascending: false,
        }),

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
        .order('appointment_date', {
          ascending: false,
        }),
    ])

    if (paymentsResult.error) {
      console.error(
        'Failed to load payments:',
        paymentsResult.error
      )

      setPayments([])
    } else {
      setPayments(
        (paymentsResult.data as unknown as Payment[]) ??
          []
      )
    }

    if (appointmentsResult.error) {
      console.error(
        'Failed to load appointments:',
        appointmentsResult.error
      )

      setAppointments([])
    } else {
      setAppointments(
        (appointmentsResult.data as unknown as AppointmentOption[]) ??
          []
      )
    }

    setLoading(false)
  }

  const selectedAppointment =
    useMemo(() => {
      return appointments.find(
        (appointment) =>
          appointment.id ===
          appointmentId
      )
    }, [
      appointments,
      appointmentId,
    ])

  const filteredPayments =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase()

      return payments.filter(
        (payment) => {
          const customer =
            payment.appointment
              ?.customer
              ?.full_name
              ?.toLowerCase() ?? ''

          const service =
            payment.appointment
              ?.service
              ?.name
              ?.toLowerCase() ?? ''

          const method =
            payment.payment_method
              ?.toLowerCase() ?? ''

          const matchesSearch =
            normalizedSearch === '' ||
            customer.includes(
              normalizedSearch
            ) ||
            service.includes(
              normalizedSearch
            )

          const matchesStatus =
            statusFilter === 'all' ||
            payment.payment_status ===
              statusFilter

          const matchesMethod =
            methodFilter === 'all' ||
            method === methodFilter

          return (
            matchesSearch &&
            matchesStatus &&
            matchesMethod
          )
        }
      )
    }, [
      payments,
      searchTerm,
      statusFilter,
      methodFilter,
    ])

  const totalPaidRevenue =
    useMemo(() => {
      return payments
        .filter(
          (payment) =>
            payment.payment_status ===
            'paid'
        )
        .reduce(
          (total, payment) =>
            total +
            Number(payment.amount),
          0
        )
    }, [payments])

  const paidCount =
    useMemo(() => {
      return payments.filter(
        (payment) =>
          payment.payment_status ===
          'paid'
      ).length
    }, [payments])

  const pendingCount =
    useMemo(() => {
      return payments.filter(
        (payment) =>
          payment.payment_status ===
          'pending'
      ).length
    }, [payments])

  const handleAppointmentChange = (
    id: string
  ) => {
    setAppointmentId(id)

    const appointment =
      appointments.find(
        (item) =>
          item.id === id
      )

    if (
      appointment?.service?.price !==
      undefined
    ) {
      setAmount(
        String(
          appointment.service.price
        )
      )
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

    const selected =
      appointments.find(
        (appointment) =>
          appointment.id ===
          appointmentId
      )

    setSaving(true)

    const {
      data,
      error,
    } = await supabase
      .from('payments')
      .insert({
        appointment_id:
          appointmentId,
        amount:
          Number(amount),
        payment_method:
          paymentMethod ||
          null,
        payment_status:
          paymentStatus,
        paid_at:
          paymentStatus ===
          'paid'
            ? new Date().toISOString()
            : null,
      })
      .select('id')
      .single()

    if (error) {
      console.error(
        'Failed to create payment:',
        error
      )

      setSaving(false)
      return
    }

    await logAudit({
      action: 'payment_recorded',
      entityType: 'payment',
      entityId: data.id,
      details: {
        appointment_id:
          appointmentId,
        customer:
          selected?.customer
            ?.full_name ?? null,
        service:
          selected?.service
            ?.name ?? null,
        amount:
          Number(amount),
        payment_method:
          paymentMethod ||
          null,
        payment_status:
          paymentStatus,
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
    const payment =
      payments.find(
        (currentPayment) =>
          currentPayment.id ===
          paymentId
      )

    if (!payment) {
      return
    }

    const previousStatus =
      payment.payment_status

    if (
      previousStatus ===
      newStatus
    ) {
      return
    }

    setUpdatingId(paymentId)

    const paidAt =
      newStatus === 'paid'
        ? new Date().toISOString()
        : null

    const { error } =
      await supabase
        .from('payments')
        .update({
          payment_status:
            newStatus,
          paid_at: paidAt,
        })
        .eq(
          'id',
          paymentId
        )

    if (error) {
      console.error(
        'Failed to update payment:',
        error
      )

      setUpdatingId(null)
      return
    }

    setPayments(
      (currentPayments) =>
        currentPayments.map(
          (currentPayment) =>
            currentPayment.id ===
            paymentId
              ? {
                  ...currentPayment,
                  payment_status:
                    newStatus,
                  paid_at:
                    paidAt,
                }
              : currentPayment
        )
    )

    await logAudit({
      action:
        'payment_status_changed',
      entityType: 'payment',
      entityId: paymentId,
      details: {
        previous_status:
          previousStatus,
        new_status:
          newStatus,
        amount:
          Number(
            payment.amount
          ),
        payment_method:
          payment.payment_method,
        customer:
          payment.appointment
            ?.customer
            ?.full_name ?? null,
        service:
          payment.appointment
            ?.service
            ?.name ?? null,
      },
    })

    setUpdatingId(null)
  }

  const getStatusStyles = (
    status: PaymentStatus
  ) => {
    switch (status) {
      case 'paid':
        return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'

      case 'failed':
        return 'border-rose-400/20 bg-rose-400/10 text-rose-300'

      case 'refunded':
        return 'border-amber-400/20 bg-amber-400/10 text-amber-300'

      default:
        return 'border-indigo-400/20 bg-indigo-400/10 text-indigo-300'
    }
  }

  const formatCurrency = (
    value: number
  ) => {
    return `₱${Number(
      value
    ).toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`
  }

  const formatMethod = (
    method: string | null
  ) => {
    if (!method) {
      return '—'
    }

    if (method === 'gcash') {
      return 'GCash'
    }

    if (method === 'maya') {
      return 'Maya'
    }

    if (
      method ===
      'bank_transfer'
    ) {
      return 'Bank Transfer'
    }

    return (
      method.charAt(0).toUpperCase() +
      method.slice(1)
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const renderNavigation = (
    mobile = false
  ) => (
    <nav className="mt-8 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon

        const active =
          item.path ===
          '/admin/payments'

        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path)

              if (mobile) {
                setMobileMenuOpen(false)
              }
            }}
            className={
              active
                ? 'flex w-full items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-left text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.08)]'
                : 'flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-slate-400 transition hover:border-white/5 hover:bg-white/5 hover:text-white'
            }
          >
            <Icon size={19} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <main className="se-page se-grid-bg relative min-h-screen overflow-hidden text-white">
      {/* BACKGROUND */}
      <div className="se-orb se-orb-indigo -left-32 top-20" />
      <div className="se-orb se-orb-cyan -right-28 top-40" />
      <div className="se-orb se-orb-violet bottom-[-140px] left-[45%]" />

      <div className="relative z-10 flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[290px] shrink-0 border-r border-white/10 bg-slate-950/55 p-6 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="se-icon-box h-12 w-12 rounded-2xl text-indigo-300">
              <Sparkles size={22} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">
                ServEase
              </p>

              <p className="mt-1 text-sm font-medium text-white">
                Admin Console
              </p>
            </div>
          </div>

          {renderNavigation()}

          <div className="mt-auto pt-8">
            <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                Access Level
              </p>

              <p className="mt-2 text-sm font-medium text-slate-300">
                Administrator
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/10 px-4 py-3 text-left text-rose-300 transition hover:border-rose-500/20 hover:bg-rose-500/10"
            >
              <LogOut size={19} />
              Logout
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-[290px] border-r border-white/10 bg-slate-950 p-6 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="se-icon-box h-11 w-11 rounded-2xl text-indigo-300">
                    <Sparkles size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
                      ServEase
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      Admin Console
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {renderNavigation(true)}

              <button
                onClick={handleLogout}
                className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-rose-500/10 px-4 py-3 text-left text-rose-300"
              >
                <LogOut size={19} />
                Logout
              </button>
            </aside>
          </>
        )}

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          {/* MOBILE HEADER */}
          <div className="border-b border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="se-icon-box h-10 w-10 rounded-xl text-indigo-300">
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                    ServEase
                  </p>

                  <p className="text-sm font-medium">
                    Admin Console
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
            {/* PAGE HEADER */}
            <header className="se-glass rounded-[28px] px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                  <div className="se-icon-box h-14 w-14 rounded-2xl text-emerald-300">
                    <CreditCard size={25} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                      Payment Management
                    </p>

                    <h1 className="se-gradient-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                      Payments
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      Record appointment payments,
                      update payment status, and review
                      ServEase payment activity.
                    </p>
                  </div>
                </div>

                {/* REAL STATS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="se-glass se-card-3d min-w-[120px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-500">
                      Records
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : payments.length}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[120px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-emerald-400">
                      Paid
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : paidCount}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[120px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-indigo-400">
                      Pending
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : pendingCount}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* REVENUE CARD */}
            <section className="se-glass se-card-3d mt-7 rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="se-icon-box h-12 w-12 rounded-2xl text-emerald-300">
                  <CircleDollarSign size={22} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Total Paid Revenue
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {loading
                      ? '...'
                      : formatCurrency(
                          totalPaidRevenue
                        )}
                  </p>

                  <p className="mt-1 text-xs text-emerald-400">
                    Sum of payment records currently
                    marked as paid
                  </p>
                </div>
              </div>
            </section>

            {/* PAYMENT WORKSPACE */}
            <section className="se-glass mt-7 overflow-hidden rounded-[28px]">
              {/* RECORD PAYMENT */}
              <form
                onSubmit={handleSubmit}
                className="border-b border-white/10 px-6 py-6 sm:px-8"
              >
                <div className="flex items-center gap-3">
                  <div className="se-icon-box h-10 w-10 rounded-xl text-emerald-300">
                    <CirclePlus size={18} />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Record Payment
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Create a payment record for a
                      ServEase appointment.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {/* APPOINTMENT */}
                  <div>
                    <label className="text-sm text-slate-400">
                      Appointment
                    </label>

                    <select
                      required
                      value={appointmentId}
                      onChange={(event) =>
                        handleAppointmentChange(
                          event.target.value
                        )
                      }
                      className="se-input mt-2 w-full rounded-2xl px-4 py-3.5 text-sm"
                    >
                      <option
                        value=""
                        className="bg-slate-900"
                      >
                        Select appointment
                      </option>

                      {appointments.map(
                        (appointment) => (
                          <option
                            key={appointment.id}
                            value={appointment.id}
                            className="bg-slate-900"
                          >
                            {appointment.customer
                              ?.full_name ??
                              'Customer'}
                            {' — '}
                            {appointment.service
                              ?.name ??
                              'Service'}
                            {' — '}
                            {
                              appointment.appointment_date
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* AMOUNT */}
                  <div>
                    <label className="text-sm text-slate-400">
                      Amount
                    </label>

                    <div className="relative mt-2">
                      <PhilippinePeso
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(event) =>
                          setAmount(
                            event.target.value
                          )
                        }
                        className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  {/* METHOD */}
                  <div>
                    <label className="text-sm text-slate-400">
                      Payment Method
                    </label>

                    <select
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value
                        )
                      }
                      className="se-input mt-2 w-full rounded-2xl px-4 py-3.5 text-sm"
                    >
                      <option
                        value=""
                        className="bg-slate-900"
                      >
                        Select method
                      </option>

                      <option
                        value="cash"
                        className="bg-slate-900"
                      >
                        Cash
                      </option>

                      <option
                        value="gcash"
                        className="bg-slate-900"
                      >
                        GCash
                      </option>

                      <option
                        value="maya"
                        className="bg-slate-900"
                      >
                        Maya
                      </option>

                      <option
                        value="bank_transfer"
                        className="bg-slate-900"
                      >
                        Bank Transfer
                      </option>
                    </select>
                  </div>

                  {/* STATUS */}
                  <div>
                    <label className="text-sm text-slate-400">
                      Payment Status
                    </label>

                    <select
                      value={paymentStatus}
                      onChange={(event) =>
                        setPaymentStatus(
                          event.target
                            .value as PaymentStatus
                        )
                      }
                      className="se-input mt-2 w-full rounded-2xl px-4 py-3.5 text-sm"
                    >
                      <option
                        value="pending"
                        className="bg-slate-900"
                      >
                        Pending
                      </option>

                      <option
                        value="paid"
                        className="bg-slate-900"
                      >
                        Paid
                      </option>

                      <option
                        value="failed"
                        className="bg-slate-900"
                      >
                        Failed
                      </option>

                      <option
                        value="refunded"
                        className="bg-slate-900"
                      >
                        Refunded
                      </option>
                    </select>
                  </div>
                </div>

                {/* SELECTED APPOINTMENT */}
                {selectedAppointment && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                      Selected Appointment
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <p className="text-slate-400">
                        Customer:{' '}
                        <span className="text-white">
                          {selectedAppointment
                            .customer
                            ?.full_name ??
                            'Customer'}
                        </span>
                      </p>

                      <p className="text-slate-400">
                        Service:{' '}
                        <span className="text-white">
                          {selectedAppointment
                            .service
                            ?.name ??
                            'Service'}
                        </span>
                      </p>

                      <p className="text-slate-400">
                        Date:{' '}
                        <span className="text-white">
                          {
                            selectedAppointment.appointment_date
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="se-btn-primary mt-6 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={17} />

                  {saving
                    ? 'Saving...'
                    : 'Record Payment'}
                </button>
              </form>

              {/* PAYMENT RECORDS HEADER */}
              <div className="border-b border-white/10 bg-white/[0.015] px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                      Payment Records
                    </p>

                    <h2 className="mt-2 text-xl font-semibold">
                      Manage Payments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Search payment records and update
                      their current payment status.
                    </p>
                  </div>

                  <div className="grid w-full gap-3 md:grid-cols-[1fr_170px_170px] xl:max-w-3xl">
                    {/* SEARCH */}
                    <div className="relative">
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) =>
                          setSearchTerm(
                            event.target.value
                          )
                        }
                        placeholder="Search customer or service"
                        className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                      />
                    </div>

                    {/* STATUS FILTER */}
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value
                        )
                      }
                      className="se-input rounded-2xl px-4 py-3.5 text-sm"
                    >
                      <option
                        value="all"
                        className="bg-slate-900"
                      >
                        All statuses
                      </option>

                      <option
                        value="pending"
                        className="bg-slate-900"
                      >
                        Pending
                      </option>

                      <option
                        value="paid"
                        className="bg-slate-900"
                      >
                        Paid
                      </option>

                      <option
                        value="failed"
                        className="bg-slate-900"
                      >
                        Failed
                      </option>

                      <option
                        value="refunded"
                        className="bg-slate-900"
                      >
                        Refunded
                      </option>
                    </select>

                    {/* METHOD FILTER */}
                    <select
                      value={methodFilter}
                      onChange={(event) =>
                        setMethodFilter(
                          event.target.value
                        )
                      }
                      className="se-input rounded-2xl px-4 py-3.5 text-sm"
                    >
                      <option
                        value="all"
                        className="bg-slate-900"
                      >
                        All methods
                      </option>

                      <option
                        value="cash"
                        className="bg-slate-900"
                      >
                        Cash
                      </option>

                      <option
                        value="gcash"
                        className="bg-slate-900"
                      >
                        GCash
                      </option>

                      <option
                        value="maya"
                        className="bg-slate-900"
                      >
                        Maya
                      </option>

                      <option
                        value="bank_transfer"
                        className="bg-slate-900"
                      >
                        Bank Transfer
                      </option>
                    </select>
                  </div>
                </div>

                <p className="mt-5 text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-white">
                    {filteredPayments.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-white">
                    {payments.length}
                  </span>{' '}
                  payment records
                </p>
              </div>

              {/* PAYMENT DATA */}
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300" />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading payments...
                    </p>
                  </div>
                </div>
              ) : payments.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <CreditCard
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No payments recorded yet.
                    </p>
                  </div>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No payments match your current filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/10 bg-white/[0.025]">
                        <tr>
                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Customer
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Service
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Appointment
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Amount
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Method
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Status
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Paid
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredPayments.map(
                          (payment) => (
                            <tr
                              key={payment.id}
                              className="border-b border-white/5 transition hover:bg-white/[0.035] last:border-0"
                            >
                              <td className="px-6 py-5 font-medium text-white">
                                {payment.appointment
                                  ?.customer
                                  ?.full_name ??
                                  'Customer'}
                              </td>

                              <td className="px-6 py-5 text-sm text-slate-300">
                                {payment.appointment
                                  ?.service
                                  ?.name ??
                                  'Service'}
                              </td>

                              <td className="whitespace-nowrap px-6 py-5">
                                <p className="text-sm text-slate-300">
                                  {payment.appointment
                                    ?.appointment_date ??
                                    '—'}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {payment.appointment
                                    ?.appointment_time
                                    ? payment.appointment.appointment_time.slice(
                                        0,
                                        5
                                      )
                                    : '—'}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-6 py-5 font-semibold text-white">
                                {formatCurrency(
                                  payment.amount
                                )}
                              </td>

                              <td className="px-6 py-5 text-sm text-slate-300">
                                {formatMethod(
                                  payment.payment_method
                                )}
                              </td>

                              <td className="px-6 py-5">
                                <select
                                  value={
                                    payment.payment_status
                                  }
                                  disabled={
                                    updatingId ===
                                    payment.id
                                  }
                                  onChange={(event) =>
                                    handleStatusChange(
                                      payment.id,
                                      event.target
                                        .value as PaymentStatus
                                    )
                                  }
                                  className={`rounded-xl border px-3 py-2 text-xs font-medium capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyles(
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

                                {updatingId ===
                                  payment.id && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    Updating...
                                  </p>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-400">
                                {payment.paid_at
                                  ? new Date(
                                      payment.paid_at
                                    ).toLocaleDateString(
                                      'en-PH',
                                      {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      }
                                    )
                                  : '—'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE / TABLET */}
                  <div className="grid gap-4 p-5 xl:hidden">
                    {filteredPayments.map(
                      (payment) => (
                        <article
                          key={payment.id}
                          className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/50 p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                                Customer
                              </p>

                              <h3 className="mt-2 text-lg font-semibold">
                                {payment.appointment
                                  ?.customer
                                  ?.full_name ??
                                  'Customer'}
                              </h3>

                              <p className="mt-1 text-sm text-slate-400">
                                {payment.appointment
                                  ?.service
                                  ?.name ??
                                  'Service'}
                              </p>
                            </div>

                            <span
                              className={`self-start rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${getStatusStyles(
                                payment.payment_status
                              )}`}
                            >
                              {
                                payment.payment_status
                              }
                            </span>
                          </div>

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-slate-600">
                                Amount
                              </p>

                              <p className="mt-1 font-semibold text-white">
                                {formatCurrency(
                                  payment.amount
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-600">
                                Method
                              </p>

                              <p className="mt-1 text-sm text-slate-300">
                                {formatMethod(
                                  payment.payment_method
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-600">
                                Appointment
                              </p>

                              <p className="mt-1 text-sm text-slate-300">
                                {payment.appointment
                                  ?.appointment_date ??
                                  '—'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-600">
                                Paid Date
                              </p>

                              <p className="mt-1 text-sm text-slate-300">
                                {payment.paid_at
                                  ? new Date(
                                      payment.paid_at
                                    ).toLocaleDateString(
                                      'en-PH',
                                      {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      }
                                    )
                                  : '—'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5">
                            <label className="mb-2 block text-xs text-slate-500">
                              Payment Status
                            </label>

                            <select
                              value={
                                payment.payment_status
                              }
                              disabled={
                                updatingId ===
                                payment.id
                              }
                              onChange={(event) =>
                                handleStatusChange(
                                  payment.id,
                                  event.target
                                    .value as PaymentStatus
                                )
                              }
                              className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium capitalize outline-none ${getStatusStyles(
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

                            {updatingId ===
                              payment.id && (
                              <p className="mt-2 text-xs text-slate-500">
                                Updating payment...
                              </p>
                            )}
                          </div>
                        </article>
                      )
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminPayments