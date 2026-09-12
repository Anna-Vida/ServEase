import request from 'supertest'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { app } from '../app.js'
import { createSupabaseClient } from '../lib/supabase.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'

vi.mock('../lib/supabase.js', () => ({
  createSupabaseClient: vi.fn(),
}))

vi.mock('../services/emailService.js', () => ({
  sendBookingConfirmationEmail: vi.fn(),
}))

const mockedCreateSupabaseClient = vi.mocked(
  createSupabaseClient,
)

const mockedSendEmail = vi.mocked(
  sendBookingConfirmationEmail,
)

describe('Authenticated booking confirmation API', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rejects requests without authentication', async () => {
    const authClient = {
      auth: {
        getUser: vi.fn(),
      },
    }

    mockedCreateSupabaseClient.mockReturnValue(
      authClient as never,
    )

    const response = await request(app)
      .post('/api/notifications/booking-confirmation')
      .send({
        bookingId: 'booking-123',
      })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)

    expect(mockedSendEmail).not.toHaveBeenCalled()
  })

  it('rejects requests without a bookingId', async () => {
    const authClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'customer-123',
              email: 'customer@example.com',
            },
          },
          error: null,
        }),
      },
    }

    mockedCreateSupabaseClient.mockReturnValue(
      authClient as never,
    )

    const response = await request(app)
      .post('/api/notifications/booking-confirmation')
      .set('Authorization', 'Bearer test-token')
      .send({})

    expect(response.status).toBe(400)
    expect(mockedSendEmail).not.toHaveBeenCalled()
  })

  it('sends confirmation using trusted booking data', async () => {
    const mockAppointmentSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'booking-123',
        customer_id: 'customer-123',
        appointment_date: '2026-09-20',
        appointment_time: '10:00',
        status: 'pending',
        service: {
          name: 'Premium Service',
        },
      },
      error: null,
    })

    const mockProfileSingle = vi.fn().mockResolvedValue({
      data: {
        full_name: 'Test Customer',
      },
      error: null,
    })

    const mockCustomerFilter = vi.fn(() => ({ single: mockAppointmentSingle }))
    const mockBookingFilter = vi.fn(() => ({ eq: mockCustomerFilter }))

    const authenticatedDatabaseClient = {
      from: vi.fn((table: string) => {
        if (table === 'appointments') {
          return {
            select: vi.fn(() => ({
              eq: mockBookingFilter,
            })),
          }
        }

        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: mockProfileSingle,
              })),
            })),
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const authClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'customer-123',
              email: 'customer@example.com',
            },
          },
          error: null,
        }),
      },
    }

    mockedCreateSupabaseClient.mockImplementation(
      (accessToken?: string) => {
        if (accessToken === 'test-token') {
          return authenticatedDatabaseClient as never
        }

        return authClient as never
      },
    )

    mockedSendEmail.mockResolvedValue({
      id: 'email-123',
    })

    const response = await request(app)
      .post('/api/notifications/booking-confirmation')
      .set('Authorization', 'Bearer test-token')
      .send({
        bookingId: 'booking-123',
        to: 'someone-else@example.com',
        customerName: 'Untrusted Name',
        serviceName: 'Untrusted Service',
        status: 'completed',
      })

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      success: true,
      message: 'Booking confirmation sent.',
      emailId: 'email-123',
    })

    expect(authClient.auth.getUser).toHaveBeenCalledWith('test-token')
    expect(mockedCreateSupabaseClient).toHaveBeenCalledWith('test-token')
    expect(mockBookingFilter).toHaveBeenCalledWith('id', 'booking-123')
    expect(mockCustomerFilter).toHaveBeenCalledWith('customer_id', 'customer-123')
    expect(mockedSendEmail).toHaveBeenCalledOnce()
    expect(mockedSendEmail).toHaveBeenCalledWith({
      to: 'customer@example.com',
      customerName: 'Test Customer',
      serviceName: 'Premium Service',
      appointmentDate: '2026-09-20',
      appointmentTime: '10:00',
      status: 'pending',
    })
  })
})
