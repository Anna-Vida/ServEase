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
          appointment.id === appointmentId
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

          paid_at:
            paidAt,
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

      entityType:
        'payment',

      entityId:
        paymentId,

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
        return 'border-[#bfe7d6] bg-[#e9f8f1] text-[#16845b]'

      case 'failed':
        return 'border-[#f3c7bb] bg-[#fff0ec] text-[#c9472d]'

      case 'refunded':
        return 'border-[#f4dda5] bg-[#fff3d7] text-[#b26a00]'

      default:
        return 'border-[#cfe1f5] bg-[#eaf3ff] text-[#3569a6]'
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

  const getInitials = (
    name: string
  ) => {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const formatDate = (
    value: string | null
  ) => {
    if (!value) {
      return '—'
    }

    return new Date(
      value
    ).toLocaleDateString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    )
  }

  const formatAppointmentDate = (
    value: string | undefined
  ) => {
    if (!value) {
      return '—'
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const renderNavigation = (
    mobile = false
  ) => (
    <nav className="mt-8 space-y-1">
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
                ? 'flex w-full items-center gap-3 rounded-xl bg-[#ffe9db] px-4 py-3 text-left font-semibold text-[#c45231]'
                : 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-[#75675f] transition hover:bg-[#fff0e6] hover:text-[#1c1410]'
            }
          >
            <Icon size={18} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <main className="min-h-screen bg-[#fff8f1] text-[#1c1410]">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[270px] shrink-0 border-r border-[#f1ded0] bg-[#fffaf5] p-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight">
                ServEase
              </p>

              <p className="text-xs text-[#8b7c73]">
                Admin Console
              </p>
            </div>
          </div>

          {renderNavigation()}

          <div className="mt-auto border-t border-[#ead7ca] pt-6">
            <p className="px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#a09187]">
              Access level
            </p>

            <p className="mt-2 px-4 text-sm font-semibold">
              Administrator
            </p>

            <button
              onClick={handleLogout}
              className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#c9472d] transition hover:bg-[#fff0ec]"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-[#1c1410]/35 lg:hidden"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-[#f1ded0] bg-[#fffaf5] p-6 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
                    <Sparkles size={18} />
                  </div>

                  <div>
                    <p className="font-extrabold">
                      ServEase
                    </p>

                    <p className="text-xs text-[#8b7c73]">
                      Admin Console
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="rounded-lg border border-[#ead7ca] bg-white p-2 text-[#74675f]"
                >
                  <X size={18} />
                </button>
              </div>

              {renderNavigation(true)}

              <button
                onClick={handleLogout}
                className="mt-8 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#c9472d] hover:bg-[#fff0ec]"
              >
                <LogOut size={18} />
                Logout
              </button>
            </aside>
          </>
        )}

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          {/* MOBILE HEADER */}
          <div className="border-b border-[#f1ded0] bg-[#fffaf5] px-5 py-4 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#ffb020] text-white">
                  <Sparkles size={17} />
                </div>

                <div>
                  <p className="font-bold">
                    ServEase
                  </p>

                  <p className="text-xs text-[#8b7c73]">
                    Admin Console
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-lg border border-[#ead7ca] bg-white p-2.5 text-[#493c35]"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1500px] px-6 py-10 lg:px-10 lg:py-12">
            {/* HEADER */}
            <header className="border-b border-[#ead7ca] pb-9">
              <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#ff6b4a]">
                    Payment management
                  </p>

                  <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                    Manage{' '}
                    <span className="se-gradient-text">
                      Payments
                    </span>
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74675f] sm:text-base">
                    Record appointment payments,
                    update payment status, and
                    review ServEase payment activity.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-8 border-t border-[#ead7ca] pt-6 xl:border-t-0 xl:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#a09187]">
                      Records
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : payments.length}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#16845b]">
                      Paid
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : paidCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#3569a6]">
                      Pending
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {loading
                        ? '...'
                        : pendingCount}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* REVENUE */}
            <section className="border-b border-[#ead7ca] py-9">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e9f8f1] text-[#16845b]">
                  <CircleDollarSign size={21} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#16845b]">
                    Total Paid Revenue
                  </p>

                  <p className="mt-1 text-3xl font-extrabold">
                    {loading
                      ? '...'
                      : formatCurrency(
                          totalPaidRevenue
                        )}
                  </p>

                  <p className="mt-1 text-sm text-[#8b7c73]">
                    Sum of payment records currently
                    marked as paid.
                  </p>
                </div>
              </div>
            </section>

            {/* RECORD PAYMENT */}
            <section className="border-b border-[#ead7ca] py-10">
              <div className="flex items-center gap-2 text-[#ff6b4a]">
                <CirclePlus size={17} />

                <p className="text-xs font-bold uppercase tracking-[0.14em]">
                  Record payment
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-extrabold">
                New Payment Record
              </h2>

              <p className="mt-2 text-sm text-[#74675f]">
                Create a payment record for an existing
                ServEase appointment.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-7"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#493c35]">
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
                      className="se-input h-12 text-sm"
                    >
                      <option value="">
                        Select appointment
                      </option>

                      {appointments.map(
                        (appointment) => (
                          <option
                            key={appointment.id}
                            value={appointment.id}
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

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#493c35]">
                      Amount
                    </label>

                    <div className="relative">
                      <PhilippinePeso
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a09187]"
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
                        className="se-input se-input-icon-left h-12 text-sm"
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#493c35]">
                      Payment Method
                    </label>

                    <select
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value
                        )
                      }
                      className="se-input h-12 text-sm"
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
                    <label className="mb-2 block text-sm font-bold text-[#493c35]">
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
                      className="se-input h-12 text-sm"
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

                {selectedAppointment && (
                  <div className="mt-6 border-y border-[#ead7ca] py-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a09187]">
                      Selected Appointment
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-[#a09187]">
                          Customer
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {selectedAppointment
                            .customer
                            ?.full_name ??
                            'Customer'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#a09187]">
                          Service
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {selectedAppointment
                            .service
                            ?.name ??
                            'Service'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#a09187]">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {
                            selectedAppointment.appointment_date
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="se-btn-primary mt-6 flex items-center gap-2 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={17} />

                  {saving
                    ? 'Saving...'
                    : 'Record Payment'}
                </button>
              </form>
            </section>

            {/* PAYMENT RECORDS */}
            <section className="pt-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                    Payment records
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    Payment Activity
                  </h2>

                  <p className="mt-2 text-sm text-[#74675f]">
                    Search payment records and update
                    their current status.
                  </p>
                </div>

                <div className="grid w-full gap-3 md:grid-cols-[1fr_170px_170px] xl:max-w-3xl">
                  <div className="relative">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a09187]"
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
                      className="se-input se-input-icon-left h-11 text-sm"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="se-input h-11 text-sm"
                  >
                    <option value="all">
                      All statuses
                    </option>

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

                  <select
                    value={methodFilter}
                    onChange={(event) =>
                      setMethodFilter(
                        event.target.value
                      )
                    }
                    className="se-input h-11 text-sm"
                  >
                    <option value="all">
                      All methods
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
              </div>

              <p className="mt-5 text-sm text-[#8b7c73]">
                Showing{' '}
                <span className="font-semibold text-[#1c1410]">
                  {filteredPayments.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[#1c1410]">
                  {payments.length}
                </span>{' '}
                payment records
              </p>

              <div className="mt-7">
                {loading ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                    <div className="text-center">
                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                      <p className="mt-4 text-sm text-[#8b7c73]">
                        Loading payments...
                      </p>
                    </div>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                    <p className="text-sm text-[#8b7c73]">
                      No payments recorded yet.
                    </p>
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                    <div className="text-center">
                      <Search
                        size={28}
                        className="mx-auto text-[#b6a79d]"
                      />

                      <p className="mt-4 text-sm text-[#8b7c73]">
                        No payments match your current filters.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-hidden rounded-2xl border border-[#ead7ca] bg-white shadow-[0_8px_30px_rgba(91,62,47,0.04)] xl:block">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#ead7ca] bg-[#fffaf6]">
                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Customer
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Service
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Appointment
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Amount
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Method
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Status
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Paid Date
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-[#f1e4db]">
                            {filteredPayments.map(
                              (payment) => {
                                const customerName =
                                  payment.appointment
                                    ?.customer
                                    ?.full_name ??
                                  'Customer'

                                return (
                                  <tr
                                    key={payment.id}
                                    className="transition-colors hover:bg-[#fffaf6]"
                                  >
                                    {/* CUSTOMER */}
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-xs font-extrabold text-[#c45231] ring-1 ring-[#f2d7c7]">
                                          {getInitials(
                                            customerName
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <p className="truncate font-semibold text-[#1c1410]">
                                            {
                                              customerName
                                            }
                                          </p>

                                          <p className="mt-0.5 text-xs text-[#9a8a80]">
                                            Customer
                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    {/* SERVICE */}
                                    <td className="px-5 py-4">
                                      <p className="font-medium text-[#493c35]">
                                        {payment
                                          .appointment
                                          ?.service
                                          ?.name ??
                                          'Service'}
                                      </p>
                                    </td>

                                    {/* APPOINTMENT */}
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <p className="font-medium text-[#493c35]">
                                        {formatAppointmentDate(
                                          payment
                                            .appointment
                                            ?.appointment_date
                                        )}
                                      </p>

                                      <p className="mt-0.5 text-xs text-[#9a8a80]">
                                        {payment.appointment
                                          ?.appointment_time
                                          ? payment.appointment.appointment_time.slice(
                                              0,
                                              5
                                            )
                                          : '—'}
                                      </p>
                                    </td>

                                    {/* AMOUNT */}
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <p className="font-semibold text-[#1c1410]">
                                        {formatCurrency(
                                          payment.amount
                                        )}
                                      </p>

                                      <p className="mt-0.5 text-xs text-[#9a8a80]">
                                        Payment amount
                                      </p>
                                    </td>

                                    {/* METHOD */}
                                    <td className="px-5 py-4">
                                      <span className="inline-flex rounded-lg bg-[#fff4ec] px-2.5 py-1.5 text-xs font-semibold text-[#8b6f61]">
                                        {formatMethod(
                                          payment.payment_method
                                        )}
                                      </span>
                                    </td>

                                    {/* STATUS */}
                                    <td className="px-5 py-4">
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
                                        className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyles(
                                          payment.payment_status
                                        )}`}
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

                                      {updatingId ===
                                        payment.id && (
                                        <p className="mt-1.5 text-[11px] text-[#9a8a80]">
                                          Updating...
                                        </p>
                                      )}
                                    </td>

                                    {/* PAID DATE */}
                                    <td className="whitespace-nowrap px-5 py-4">
                                      <p className="font-medium text-[#493c35]">
                                        {formatDate(
                                          payment.paid_at
                                        )}
                                      </p>

                                      <p className="mt-0.5 text-xs text-[#9a8a80]">
                                        {payment.paid_at
                                          ? 'Payment completed'
                                          : 'Not paid'}
                                      </p>
                                    </td>
                                  </tr>
                                )
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* MOBILE / TABLET */}
                    <div className="overflow-hidden rounded-2xl border border-[#ead7ca] bg-white xl:hidden">
                      <div className="divide-y divide-[#f1e4db]">
                        {filteredPayments.map(
                          (payment) => {
                            const customerName =
                              payment.appointment
                                ?.customer
                                ?.full_name ??
                              'Customer'

                            return (
                              <article
                                key={payment.id}
                                className="p-5 sm:p-6"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-xs font-extrabold text-[#c45231] ring-1 ring-[#f2d7c7]">
                                      {getInitials(
                                        customerName
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <h3 className="truncate font-bold">
                                        {
                                          customerName
                                        }
                                      </h3>

                                      <p className="mt-1 truncate text-sm text-[#74675f]">
                                        {payment
                                          .appointment
                                          ?.service
                                          ?.name ??
                                          'Service'}
                                      </p>
                                    </div>
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyles(
                                      payment.payment_status
                                    )}`}
                                  >
                                    {
                                      payment.payment_status
                                    }
                                  </span>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f1e4db] pt-4">
                                  <div>
                                    <p className="text-xs font-medium text-[#9a8a80]">
                                      Amount
                                    </p>

                                    <p className="mt-1 font-semibold text-[#493c35]">
                                      {formatCurrency(
                                        payment.amount
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-medium text-[#9a8a80]">
                                      Method
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-[#493c35]">
                                      {formatMethod(
                                        payment.payment_method
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-medium text-[#9a8a80]">
                                      Appointment
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-[#493c35]">
                                      {formatAppointmentDate(
                                        payment
                                          .appointment
                                          ?.appointment_date
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs font-medium text-[#9a8a80]">
                                      Paid Date
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-[#493c35]">
                                      {formatDate(
                                        payment.paid_at
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-5">
                                  <label className="mb-2 block text-xs font-semibold text-[#74675f]">
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
                                    className={`w-full rounded-xl border px-4 py-3 text-sm font-bold capitalize outline-none ${getStatusStyles(
                                      payment.payment_status
                                    )}`}
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

                                  {updatingId ===
                                    payment.id && (
                                    <p className="mt-2 text-xs text-[#8b7c73]">
                                      Updating payment...
                                    </p>
                                  )}
                                </div>
                              </article>
                            )
                          }
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminPayments