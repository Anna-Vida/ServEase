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

  const activeServicesCount =
    useMemo(() => {
      return services.filter(
        (service) => service.is_active
      ).length
    }, [services])

  const inactiveServicesCount =
    useMemo(() => {
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

      price:
        Number(form.price),

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

          name:
            serviceData.name,

          price:
            serviceData.price,

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
          name:
            serviceData.name,

          price:
            serviceData.price,

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
      name:
        service.name,

      description:
        service.description ?? '',

      price:
        String(service.price),

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
                  is_active: newStatus,
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
    <nav className="mt-8 space-y-1">
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
            {/* PAGE HEADER */}
            <header className="border-b border-[#ead7ca] pb-9">
              <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#ff6b4a]">
                    Service management
                  </p>

                  <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                    Manage{' '}
                    <span className="se-gradient-text">
                      Services
                    </span>
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#74675f] sm:text-base">
                    Create, edit, activate, and
                    deactivate the services customers
                    can book through ServEase.
                  </p>
                </div>

                {/* COMPACT 3D STATS */}
                <div className="w-full max-w-md xl:w-auto xl:min-w-[430px]">
                  <div className="relative">
                    {/* BACK LAYER */}
                    <div className="absolute inset-x-2 top-2 h-full rounded-2xl border border-[#ead7ca] bg-[#f8e8dc]" />

                    {/* MAIN CARD */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#ead7ca] bg-white shadow-[0_10px_25px_rgba(91,62,47,0.12)]">
                      <div className="grid grid-cols-3 divide-x divide-[#ead7ca]">
                        {/* TOTAL */}
                        <div className="flex flex-col items-center justify-center px-4 py-5 text-center">
                          <p className="text-3xl font-extrabold tracking-[-0.04em] text-[#1c1410]">
                            {loading
                              ? '...'
                              : services.length}
                          </p>

                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Total
                          </p>
                        </div>

                        {/* ACTIVE */}
                        <div className="flex flex-col items-center justify-center px-4 py-5 text-center">
                          <p className="text-3xl font-extrabold tracking-[-0.04em] text-[#16845b]">
                            {loading
                              ? '...'
                              : activeServicesCount}
                          </p>

                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Active
                          </p>
                        </div>

                        {/* INACTIVE */}
                        <div className="flex flex-col items-center justify-center px-4 py-5 text-center">
                          <p className="text-3xl font-extrabold tracking-[-0.04em] text-[#ff6b4a]">
                            {loading
                              ? '...'
                              : inactiveServicesCount}
                          </p>

                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b7c73]">
                            Inactive
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* ADD / EDIT */}
            <section className="border-b border-[#ead7ca] py-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#ff6b4a]">
                    {editingId ? (
                      <Pencil size={17} />
                    ) : (
                      <CirclePlus size={17} />
                    )}

                    <p className="text-xs font-bold uppercase tracking-[0.14em]">
                      {editingId
                        ? 'Edit Service'
                        : 'Add Service'}
                    </p>
                  </div>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    {editingId
                      ? 'Update service details'
                      : 'Create a new service'}
                  </h2>

                  <p className="mt-2 text-sm text-[#74675f]">
                    {editingId
                      ? 'Changes will update the selected ServEase service.'
                      : 'New services are created as active and become available for booking.'}
                  </p>
                </div>

                {editingId && (
                  <span className="self-start rounded-full bg-[#fff0e7] px-4 py-2 text-xs font-bold text-[#b95736] sm:self-auto">
                    Editing service
                  </span>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-7"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#493c35]">
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
                      className="se-input h-12 text-sm"
                      placeholder="Example: Premium Consultation"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#493c35]">
                      Price
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
                        value={form.price}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            price:
                              event.target.value,
                          })
                        }
                        className="se-input se-input-icon-left h-12 text-sm"
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#493c35]">
                      Duration (minutes)
                    </label>

                    <div className="relative">
                      <Clock3
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a09187]"
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
                        className="se-input se-input-icon-left h-12 text-sm"
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#493c35]">
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
                      className="se-input h-12 text-sm"
                      placeholder="Short service description"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="se-btn-primary flex items-center gap-2 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="se-btn-secondary flex items-center gap-2 px-5 py-3 text-sm"
                    >
                      <X size={17} />
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* SERVICE RECORDS */}
            <section className="pt-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff6b4a]">
                    Service records
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    Service Directory
                  </h2>

                  <p className="mt-2 text-sm text-[#74675f]">
                    Search services and filter them
                    by their current active status.
                  </p>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-[1fr_180px] xl:max-w-2xl">
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
                      placeholder="Search services"
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

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              <p className="mt-5 text-sm text-[#8b7c73]">
                Showing{' '}
                <span className="font-semibold text-[#1c1410]">
                  {filteredServices.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[#1c1410]">
                  {services.length}
                </span>{' '}
                services
              </p>

              <div className="mt-7">
                {loading ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                    <div className="text-center">
                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#f4c9b7] border-t-[#ff6b4a]" />

                      <p className="mt-4 text-sm text-[#8b7c73]">
                        Loading services...
                      </p>
                    </div>
                  </div>
                ) : services.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                    <p className="text-sm text-[#8b7c73]">
                      No services found.
                    </p>
                  </div>
                ) : filteredServices.length ===
                  0 ? (
                  <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ead7ca] bg-white">
                    <div className="text-center">
                      <Search
                        size={28}
                        className="mx-auto text-[#b6a79d]"
                      />

                      <p className="mt-4 text-sm text-[#8b7c73]">
                        No services match your current filters.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-hidden rounded-2xl border border-[#ead7ca] bg-white shadow-[0_8px_30px_rgba(91,62,47,0.04)] lg:block">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#ead7ca] bg-[#fffaf6]">
                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Service
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Price
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Duration
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Status
                              </th>

                              <th className="px-5 py-3.5 font-semibold text-[#8b7c73]">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-[#f1e4db]">
                            {filteredServices.map(
                              (service) => (
                                <tr
                                  key={service.id}
                                  className="transition-colors hover:bg-[#fffaf6]"
                                >
                                  {/* SERVICE */}
                                  <td className="px-5 py-4">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-[#c45231] ring-1 ring-[#f2d7c7]">
                                        <Wrench size={15} />
                                      </div>

                                      <div className="min-w-0">
                                        <p className="font-semibold text-[#1c1410]">
                                          {
                                            service.name
                                          }
                                        </p>

                                        <p
                                          className="mt-0.5 max-w-md truncate text-xs text-[#9a8a80]"
                                          title={
                                            service.description ??
                                            ''
                                          }
                                        >
                                          {service.description ||
                                            'No description'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* PRICE */}
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <p className="font-semibold text-[#493c35]">
                                      {formatPrice(
                                        service.price
                                      )}
                                    </p>

                                    <p className="mt-0.5 text-xs text-[#9a8a80]">
                                      Service price
                                    </p>
                                  </td>

                                  {/* DURATION */}
                                  <td className="whitespace-nowrap px-5 py-4">
                                    <div className="flex items-center gap-2">
                                      <Clock3
                                        size={14}
                                        className="text-[#a09187]"
                                      />

                                      <span className="font-medium text-[#493c35]">
                                        {
                                          service.duration_minutes
                                        }{' '}
                                        min
                                      </span>
                                    </div>
                                  </td>

                                  {/* STATUS */}
                                  <td className="px-5 py-4">
                                    <span
                                      className={
                                        service.is_active
                                          ? 'inline-flex items-center gap-1.5 rounded-full border border-[#bfe7d6] bg-[#e9f8f1] px-3 py-1.5 text-xs font-bold text-[#16845b]'
                                          : 'inline-flex items-center gap-1.5 rounded-full border border-[#e4d8d0] bg-[#f4eee9] px-3 py-1.5 text-xs font-bold text-[#8b7c73]'
                                      }
                                    >
                                      <span
                                        className={
                                          service.is_active
                                            ? 'h-1.5 w-1.5 rounded-full bg-[#16845b]'
                                            : 'h-1.5 w-1.5 rounded-full bg-[#a09187]'
                                        }
                                      />

                                      {service.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                    </span>
                                  </td>

                                  {/* ACTIONS */}
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          handleEdit(
                                            service
                                          )
                                        }
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#e6d7cc] bg-white px-3 text-xs font-semibold text-[#65574f] transition hover:border-[#ffb9a3] hover:bg-[#fff8f3] hover:text-[#c45231]"
                                        title="Edit service"
                                      >
                                        <Pencil size={14} />
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
                                            ? 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#f3c7bb] bg-[#fff0ec] px-3 text-xs font-semibold text-[#c9472d] transition hover:bg-[#ffe5dd]'
                                            : 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#bfe7d6] bg-[#e9f8f1] px-3 text-xs font-semibold text-[#16845b] transition hover:bg-[#dcf4e9]'
                                        }
                                        title={
                                          service.is_active
                                            ? 'Deactivate service'
                                            : 'Activate service'
                                        }
                                      >
                                        <Power size={14} />

                                        {service.is_active
                                          ? 'Deactivate'
                                          : 'Activate'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* MOBILE */}
                    <div className="overflow-hidden rounded-2xl border border-[#ead7ca] bg-white lg:hidden">
                      <div className="divide-y divide-[#f1e4db]">
                        {filteredServices.map(
                          (service) => (
                            <article
                              key={service.id}
                              className="p-5 sm:p-6"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0e7] text-[#c45231] ring-1 ring-[#f2d7c7]">
                                    <Wrench size={16} />
                                  </div>

                                  <div className="min-w-0">
                                    <h3 className="font-bold">
                                      {
                                        service.name
                                      }
                                    </h3>

                                    <p className="mt-1 text-sm leading-6 text-[#74675f]">
                                      {service.description ||
                                        'No description'}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={
                                    service.is_active
                                      ? 'shrink-0 rounded-full border border-[#bfe7d6] bg-[#e9f8f1] px-3 py-1.5 text-xs font-bold text-[#16845b]'
                                      : 'shrink-0 rounded-full border border-[#e4d8d0] bg-[#f4eee9] px-3 py-1.5 text-xs font-bold text-[#8b7c73]'
                                  }
                                >
                                  {service.is_active
                                    ? 'Active'
                                    : 'Inactive'}
                                </span>
                              </div>

                              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f1e4db] pt-4">
                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Price
                                  </p>

                                  <p className="mt-1 font-semibold text-[#493c35]">
                                    {formatPrice(
                                      service.price
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-[#9a8a80]">
                                    Duration
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-[#493c35]">
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
                                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e6d7cc] bg-white px-4 py-3 text-sm font-semibold text-[#65574f] transition hover:border-[#ffb9a3] hover:bg-[#fff8f3] hover:text-[#c45231]"
                                >
                                  <Pencil size={16} />
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
                                      ? 'flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#f3c7bb] bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[#c9472d] transition hover:bg-[#ffe5dd]'
                                      : 'flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#bfe7d6] bg-[#e9f8f1] px-4 py-3 text-sm font-semibold text-[#16845b] transition hover:bg-[#dcf4e9]'
                                  }
                                >
                                  <Power size={16} />

                                  {service.is_active
                                    ? 'Deactivate'
                                    : 'Activate'}
                                </button>
                              </div>
                            </article>
                          )
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

export default AdminServices