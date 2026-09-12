import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../app.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'

vi.mock('../services/emailService.js', () => ({
  sendBookingConfirmationEmail: vi.fn(),
}))

const mockedSendBookingConfirmationEmail = vi.mocked(
  sendBookingConfirmationEmail,
)

describe('Booking notification API', () => {
  beforeEach(() => {
    vi.stubEnv('NOTIFICATION_WEBHOOK_SECRET', 'test-secret')
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects requests without the webhook secret', async () => {
    const response = await request(app)
      .post('/api/notifications/booking')
      .send({
        to: 'customer@example.com',
        customerName: 'Test Customer',
        serviceName: 'Premium Service',
        appointmentDate: '2026-09-20',
        appointmentTime: '10:00',
        status: 'confirmed',
      })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)

    expect(mockedSendBookingConfirmationEmail).not.toHaveBeenCalled()
  })

  it('rejects incomplete booking data', async () => {
    const response = await request(app)
      .post('/api/notifications/booking')
      .set('x-webhook-secret', 'test-secret')
      .send({
        to: 'customer@example.com',
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)

    expect(mockedSendBookingConfirmationEmail).not.toHaveBeenCalled()
  })

  it('sends a booking notification for a valid request', async () => {
    mockedSendBookingConfirmationEmail.mockResolvedValue({
      id: 'test-email-id',
    })

    const response = await request(app)
      .post('/api/notifications/booking')
      .set('x-webhook-secret', 'test-secret')
      .send({
        to: 'customer@example.com',
        customerName: 'Test Customer',
        serviceName: 'Premium Service',
        appointmentDate: '2026-09-20',
        appointmentTime: '10:00',
        status: 'confirmed',
      })

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      success: true,
      message: 'Booking notification sent.',
      emailId: 'test-email-id',
    })

    expect(mockedSendBookingConfirmationEmail).toHaveBeenCalledOnce()

    expect(mockedSendBookingConfirmationEmail).toHaveBeenCalledWith({
      to: 'customer@example.com',
      customerName: 'Test Customer',
      serviceName: 'Premium Service',
      appointmentDate: '2026-09-20',
      appointmentTime: '10:00',
      status: 'confirmed',
    })
  })
})
