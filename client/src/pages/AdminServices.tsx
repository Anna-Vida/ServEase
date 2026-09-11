import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  CirclePlus,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  PhilippinePeso,
  Power,
  Search,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
  is_active: boolean
}

type ServiceForm = {
  name: string
  description: string
  price: string
  duration_minutes: string
}

type NavItem = {
  label: string
  path: string
  icon: React.ElementType
}

const emptyForm: ServiceForm = {
  name: '',
  description: '',
  price: '',
  duration_minutes: '',
}

function AdminServices() {
  const navigate = useNavigate()

  const [services, setServices] =
    useState<Service[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [form, setForm] =
    useState<ServiceForm>(emptyForm)

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
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
    loadServices()
  }, [])

  const loadServices = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        price,
        duration_minutes,
        is_active
      `)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Failed to load services:',
        error
      )

      setServices([])
    } else {
      setServices(
        (data as Service[]) ?? []
      )
    }

    setLoading(false)
  }

  const filteredServices = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    return services.filter((service) => {
      const matchesSearch =
        normalizedSearch === '' ||
        service.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (service.description ?? '')
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'
          ? service.is_active
          : !service.is_active)

      return (
        matchesSearch &&
        matchesStatus
      )
    })
  }, [
    services,
    searchTerm,
    statusFilter,
  ])

  const activeServicesCount = useMemo(() => {
    return services.filter(
      (service) => service.is_active
    ).length
  }, [services])

  const inactiveServicesCount = useMemo(() => {
    return services.filter(
      (service) => !service.is_active
    ).length
  }, [services])

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setSaving(true)

    const serviceData = {
      name: form.name.trim(),
      description:
        form.description.trim() || null,
      price: Number(form.price),
      duration_minutes:
        Number(form.duration_minutes),
      updated_at:
        new Date().toISOString(),
    }

    if (editingId) {
      const existingService =
        services.find(
          (service) =>
            service.id === editingId
        )

      const { error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingId)

      if (error) {
        console.error(
          'Failed to update service:',
          error
        )

        setSaving(false)
        return
      }

      await logAudit({
        action: 'service_updated',
        entityType: 'service',
        entityId: editingId,
        details: {
          previous_name:
            existingService?.name ?? null,
          name: serviceData.name,
          price: serviceData.price,
          duration_minutes:
            serviceData.duration_minutes,
        },
      })
    } else {
      const {
        data,
        error,
      } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          is_active: true,
        })
        .select('id')
        .single()

      if (error) {
        console.error(
          'Failed to create service:',
          error
        )

        setSaving(false)
        return
      }

      await logAudit({
        action: 'service_created',
        entityType: 'service',
        entityId: data.id,
        details: {
          name: serviceData.name,
          price: serviceData.price,
          duration_minutes:
            serviceData.duration_minutes,
        },
      })
    }

    setForm(emptyForm)
    setEditingId(null)
    setSaving(false)

    await loadServices()
  }

  const handleEdit = (
    service: Service
  ) => {
    setEditingId(service.id)

    setForm({
      name: service.name,
      description:
        service.description ?? '',
      price: String(service.price),
      duration_minutes:
        String(
          service.duration_minutes
        ),
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleToggleActive = async (
    service: Service
  ) => {
    const newStatus =
      !service.is_active

    const { error } = await supabase
      .from('services')
      .update({
        is_active: newStatus,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', service.id)

    if (error) {
      console.error(
        'Failed to update service status:',
        error
      )

      return
    }

    setServices(
      (currentServices) =>
        currentServices.map(
          (currentService) =>
            currentService.id ===
            service.id
              ? {
                  ...currentService,
                  is_active:
                    newStatus,
                }
              : currentService
        )
    )

    await logAudit({
      action: newStatus
        ? 'service_activated'
        : 'service_deactivated',
      entityType: 'service',
      entityId: service.id,
      details: {
        service_name:
          service.name,
        previous_status:
          service.is_active
            ? 'active'
            : 'inactive',
        new_status:
          newStatus
            ? 'active'
            : 'inactive',
      },
    })
  }

  const formatPrice = (
    value: number
  ) => {
    return `₱${Number(
      value
    ).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
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
          '/admin/services'

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
                ? 'flex w-full items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-left text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.08)]'
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
                  <div className="se-icon-box h-14 w-14 rounded-2xl text-violet-300">
                    <Wrench size={25} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
                      Service Management
                    </p>

                    <h1 className="se-gradient-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                      Services
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      Create, edit, activate,
                      and deactivate the services
                      customers can book through
                      ServEase.
                    </p>
                  </div>
                </div>

                {/* REAL STATS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="se-glass se-card-3d min-w-[110px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-500">
                      Total
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : services.length}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[110px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-emerald-400">
                      Active
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : activeServicesCount}
                    </p>
                  </div>

                  <div className="se-glass se-card-3d min-w-[110px] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-500">
                      Inactive
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {loading
                        ? '...'
                        : inactiveServicesCount}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* SERVICE MANAGEMENT */}
            <section className="se-glass mt-7 overflow-hidden rounded-[28px]">
              {/* ADD / EDIT FORM */}
              <form
                onSubmit={handleSubmit}
                className="border-b border-white/10 px-6 py-6 sm:px-8"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="se-icon-box h-10 w-10 rounded-xl text-violet-300">
                      {editingId ? (
                        <Pencil size={18} />
                      ) : (
                        <CirclePlus size={18} />
                      )}
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        {editingId
                          ? 'Edit Service'
                          : 'Add Service'}
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        {editingId
                          ? 'Update the selected ServEase service.'
                          : 'Create a new service available in the ServEase system.'}
                      </p>
                    </div>
                  </div>

                  {editingId && (
                    <span className="se-badge self-start rounded-full px-4 py-2 text-xs sm:self-auto">
                      Editing service
                    </span>
                  )}
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {/* NAME */}
                  <div>
                    <label className="text-sm text-slate-400">
                      Service Name
                    </label>

                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          name:
                            event.target.value,
                        })
                      }
                      className="se-input mt-2 w-full rounded-2xl px-4 py-3.5 text-sm"
                      placeholder="Example: Premium Consultation"
                    />
                  </div>

                  {/* PRICE */}
                  <div>
                    <label className="text-sm text-slate-400">
                      Price
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
                        value={form.price}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            price:
                              event.target.value,
                          })
                        }
                        className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  {/* DURATION */}
                  <div>
                    <label className="text-sm text-slate-400">
                      Duration (minutes)
                    </label>

                    <div className="relative mt-2">
                      <Clock3
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        type="number"
                        min="1"
                        required
                        value={
                          form.duration_minutes
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,
                            duration_minutes:
                              event.target.value,
                          })
                        }
                        className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                        placeholder="60"
                      />
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <label className="text-sm text-slate-400">
                      Description
                    </label>

                    <input
                      type="text"
                      value={
                        form.description
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          description:
                            event.target.value,
                        })
                      }
                      className="se-input mt-2 w-full rounded-2xl px-4 py-3.5 text-sm"
                      placeholder="Short service description"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="se-btn-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editingId ? (
                      <Pencil size={17} />
                    ) : (
                      <CirclePlus size={17} />
                    )}

                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Save Changes'
                        : 'Add Service'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={
                        handleCancelEdit
                      }
                      className="se-btn-secondary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                    >
                      <X size={17} />
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* SERVICE LIST HEADER */}
              <div className="border-b border-white/10 bg-white/[0.015] px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                      Service Records
                    </p>

                    <h2 className="mt-2 text-xl font-semibold">
                      Manage Services
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Search services and filter
                      them by their current active
                      status.
                    </p>
                  </div>

                  <div className="grid w-full gap-3 sm:grid-cols-[1fr_180px] xl:max-w-2xl">
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
                        placeholder="Search services"
                        className="se-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm"
                      />
                    </div>

                    {/* FILTER */}
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
                        value="active"
                        className="bg-slate-900"
                      >
                        Active
                      </option>

                      <option
                        value="inactive"
                        className="bg-slate-900"
                      >
                        Inactive
                      </option>
                    </select>
                  </div>
                </div>

                <p className="mt-5 text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-white">
                    {
                      filteredServices.length
                    }
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-white">
                    {services.length}
                  </span>{' '}
                  services
                </p>
              </div>

              {/* DATA */}
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />

                    <p className="mt-4 text-sm text-slate-500">
                      Loading services...
                    </p>
                  </div>
                </div>
              ) : services.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Wrench
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No services found.
                    </p>
                  </div>
                </div>
              ) : filteredServices.length ===
                0 ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Search
                      size={28}
                      className="mx-auto text-slate-600"
                    />

                    <p className="mt-4 text-sm text-slate-500">
                      No services match your
                      current filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/10 bg-white/[0.025]">
                        <tr>
                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Service
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Price
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Duration
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Status
                          </th>

                          <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredServices.map(
                          (service) => (
                            <tr
                              key={service.id}
                              className="border-b border-white/5 transition hover:bg-white/[0.035] last:border-0"
                            >
                              {/* SERVICE */}
                              <td className="px-6 py-5">
                                <div className="flex items-start gap-3">
                                  <div className="se-icon-box h-10 w-10 shrink-0 rounded-xl text-violet-300">
                                    <Wrench
                                      size={17}
                                    />
                                  </div>

                                  <div>
                                    <p className="font-medium text-white">
                                      {
                                        service.name
                                      }
                                    </p>

                                    <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                                      {service.description ||
                                        'No description'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* PRICE */}
                              <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-slate-300">
                                {formatPrice(
                                  service.price
                                )}
                              </td>

                              {/* DURATION */}
                              <td className="whitespace-nowrap px-6 py-5">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                  <Clock3
                                    size={15}
                                    className="text-slate-500"
                                  />

                                  {
                                    service.duration_minutes
                                  }{' '}
                                  min
                                </div>
                              </td>

                              {/* STATUS */}
                              <td className="px-6 py-5">
                                <span
                                  className={
                                    service.is_active
                                      ? 'inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300'
                                      : 'inline-flex rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-500'
                                  }
                                >
                                  {service.is_active
                                    ? 'Active'
                                    : 'Inactive'}
                                </span>
                              </td>

                              {/* ACTIONS */}
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleEdit(
                                        service
                                      )
                                    }
                                    className="rounded-xl border border-white/10 bg-white/[0.025] p-2.5 text-slate-300 transition hover:border-violet-400/20 hover:bg-violet-500/10 hover:text-violet-200"
                                    title="Edit service"
                                  >
                                    <Pencil
                                      size={16}
                                    />
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleToggleActive(
                                        service
                                      )
                                    }
                                    className={
                                      service.is_active
                                        ? 'rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 text-rose-300 transition hover:bg-rose-500/10'
                                        : 'rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-emerald-300 transition hover:bg-emerald-500/10'
                                    }
                                    title={
                                      service.is_active
                                        ? 'Deactivate service'
                                        : 'Activate service'
                                    }
                                  >
                                    <Power
                                      size={16}
                                    />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE / TABLET CARDS */}
                  <div className="grid gap-4 p-5 lg:hidden">
                    {filteredServices.map(
                      (service) => (
                        <article
                          key={service.id}
                          className="se-card-3d rounded-3xl border border-white/10 bg-slate-950/50 p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="se-icon-box h-11 w-11 shrink-0 rounded-xl text-violet-300">
                                <Wrench
                                  size={18}
                                />
                              </div>

                              <div>
                                <h3 className="font-semibold">
                                  {
                                    service.name
                                  }
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  {service.description ||
                                    'No description'}
                                </p>
                              </div>
                            </div>

                            <span
                              className={
                                service.is_active
                                  ? 'shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300'
                                  : 'shrink-0 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-medium text-slate-500'
                              }
                            >
                              {service.is_active
                                ? 'Active'
                                : 'Inactive'}
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-600">
                                Price
                              </p>

                              <p className="mt-1 font-medium text-slate-300">
                                {formatPrice(
                                  service.price
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-600">
                                Duration
                              </p>

                              <p className="mt-1 text-sm text-slate-300">
                                {
                                  service.duration_minutes
                                }{' '}
                                minutes
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex gap-3">
                            <button
                              onClick={() =>
                                handleEdit(
                                  service
                                )
                              }
                              className="se-btn-secondary flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm"
                            >
                              <Pencil
                                size={16}
                              />
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleToggleActive(
                                  service
                                )
                              }
                              className={
                                service.is_active
                                  ? 'flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10'
                                  : 'flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10'
                              }
                            >
                              <Power
                                size={16}
                              />

                              {service.is_active
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
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

export default AdminServices