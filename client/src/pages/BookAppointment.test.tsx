import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BookAppointment from './BookAppointment'

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  single: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'customer-123' } } }),
      getSession: mocks.getSession,
    },
    from: (table: string) => {
      if (table === 'appointments') return { insert: mocks.insert }
      if (table === 'services') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{ id: 'service-123', name: 'Premium Service', price: 1000, duration_minutes: 60 }],
                error: null,
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  },
}))

async function submitBooking() {
  render(<MemoryRouter><BookAppointment /></MemoryRouter>)
  await screen.findByRole('option', { name: /premium service/i })
  fireEvent.change(screen.getByLabelText(/^service$/i), { target: { value: 'service-123' } })
  fireEvent.change(screen.getByLabelText(/appointment date/i), { target: { value: '2099-09-20' } })
  fireEvent.change(screen.getByLabelText(/appointment time/i), { target: { value: '10:00' } })
  fireEvent.click(screen.getByRole('button', { name: /^book appointment$/i }))
}

describe('Booking confirmation workflow', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.insert.mockReturnValue({ select: () => ({ single: mocks.single }) })
    mocks.single.mockResolvedValue({ data: { id: 'booking-123' }, error: null })
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'test-token' } } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it.each([true, false])('keeps the booking successful when notification success is %s', async (ok) => {
    fetchMock.mockResolvedValue({
      ok,
      json: async () => ({ success: ok, message: ok ? 'Sent.' : 'Email unavailable.' }),
    })

    await submitBooking()

    expect(await screen.findByText('Appointment booked successfully.')).toBeInTheDocument()
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith({
      customer_id: 'customer-123', service_id: 'service-123',
      appointment_date: '2099-09-20', appointment_time: '10:00', notes: null,
    })
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('/api/notifications/booking-confirmation'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
        body: JSON.stringify({ bookingId: 'booking-123' }),
      },
    )
    expect(screen.getByLabelText(/^service$/i)).toHaveValue('')
    expect(screen.getByRole('button', { name: /^book appointment$/i })).toBeEnabled()
  })

  it('does not request an email when the appointment insert fails', async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: 'Booking unavailable.' } })
    await submitBooking()
    expect(await screen.findByText('Booking unavailable.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps the booking successful when session lookup fails', async () => {
    mocks.getSession.mockRejectedValue(new Error('Session unavailable.'))
    await submitBooking()
    expect(await screen.findByText('Appointment booked successfully.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
