import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  CirclePlus,
  Pencil,
  Power,
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
  is_active: boolean
}

type ServiceForm = {
  name: string
  description: string
  price: string
  duration_minutes: string
}

const emptyForm: ServiceForm = {
  name: '',
  description: '',
  price: '',
  duration_minutes: '',
}

function AdminServices() {
  const navigate = useNavigate()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceForm>(emptyForm)

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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load services:', error)
    } else {
      setServices((data as Service[]) ?? [])
    }

    setLoading(false)
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setSaving(true)

    const serviceData = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      duration_minutes: Number(form.duration_minutes),
      updated_at: new Date().toISOString(),
    }

    if (editingId) {
      const { error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingId)

      if (error) {
        console.error('Failed to update service:', error)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          is_active: true,
        })

      if (error) {
        console.error('Failed to create service:', error)
        setSaving(false)
        return
      }
    }

    setForm(emptyForm)
    setEditingId(null)
    setSaving(false)
    await loadServices()
  }

  const handleEdit = (service: Service) => {
    setEditingId(service.id)

    setForm({
      name: service.name,
      description: service.description ?? '',
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
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

  const handleToggleActive = async (service: Service) => {
    const { error } = await supabase
      .from('services')
      .update({
        is_active: !service.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', service.id)

    if (error) {
      console.error('Failed to update service status:', error)
      return
    }

    setServices((currentServices) =>
      currentServices.map((currentService) =>
        currentService.id === service.id
          ? {
              ...currentService,
              is_active: !currentService.is_active,
            }
          : currentService
      )
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ChevronLeft size={18} />
          Back to dashboard
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
            <Wrench size={24} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
              ServEase
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Services
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <CirclePlus size={20} className="text-violet-300" />

            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit Service' : 'Add Service'}
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
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
                    name: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                placeholder="Example: Premium Consultation"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">
                Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(event) =>
                  setForm({
                    ...form,
                    price: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">
                Duration (minutes)
              </label>

              <input
                type="number"
                min="1"
                required
                value={form.duration_minutes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    duration_minutes: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                placeholder="60"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">
                Description
              </label>

              <input
                type="text"
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-400"
                placeholder="Short service description"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save Changes'
                  : 'Add Service'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {loading ? (
            <div className="p-8 text-slate-400">
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className="p-8 text-slate-400">
              No services found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Service
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Price
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Duration
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((service) => (
                    <tr
                      key={service.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">
                          {service.name}
                        </p>

                        <p className="mt-1 max-w-md text-sm text-slate-500">
                          {service.description || 'No description'}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        ₱
                        {Number(service.price).toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {service.duration_minutes} min
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            service.is_active
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                            title="Edit service"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => handleToggleActive(service)}
                            className={`rounded-lg border p-2 transition ${
                              service.is_active
                                ? 'border-red-500/20 text-red-300 hover:bg-red-500/10'
                                : 'border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10'
                            }`}
                            title={
                              service.is_active
                                ? 'Deactivate service'
                                : 'Activate service'
                            }
                          >
                            <Power size={16} />
                          </button>
                        </div>
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

export default AdminServices