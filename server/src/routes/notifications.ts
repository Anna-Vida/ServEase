import { Router } from 'express'
import { verifyWebhookSecret } from '../middleware/verifyWebhookSecret.js'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/requireAuth.js'
import { createSupabaseClient } from '../lib/supabase.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'

export const notificationsRouter = Router()

// Existing server-to-server webhook endpoint
notificationsRouter.post(
  '/booking',
  verifyWebhookSecret,
  async (req, res) => {
    const {
      to,
      customerName,
      serviceName,
      appointmentDate,
      appointmentTime,
      status,
    } = req.body ?? {}

    if (
      !to ||
      !customerName ||
      !serviceName ||
      !appointmentDate ||
      !appointmentTime ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking notification fields.',
      })
    }

    try {
      const result = await sendBookingConfirmationEmail({
        to,
        customerName,
        serviceName,
        appointmentDate,
        appointmentTime,
        status,
      })

      return res.status(200).json({
        success: true,
        message: 'Booking notification sent.',
        emailId: result?.id ?? null,
      })
    } catch (error) {
      console.error('Booking email failed:', error)

      return res.status(502).json({
        success: false,
        message: 'Failed to send booking notification.',
      })
    }
  },
)

// Authenticated customer endpoint
notificationsRouter.post(
  '/booking-confirmation',
  requireAuth,
  async (req, res) => {
    const authenticatedRequest = req as AuthenticatedRequest
    const { bookingId } = req.body ?? {}

    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid bookingId is required.',
      })
    }

    if (!authenticatedRequest.user.email) {
      return res.status(400).json({
        success: false,
        message: 'Authenticated user does not have an email address.',
      })
    }

    try {
      const supabase = createSupabaseClient(
        authenticatedRequest.accessToken,
      )

      const {
        data: booking,
        error: bookingError,
      } = await supabase
        .from('appointments')
        .select(`
          id,
          customer_id,
          appointment_date,
          appointment_time,
          status,
          service:services (
            name
          )
        `)
        .eq('id', bookingId)
        .eq('customer_id', authenticatedRequest.user.id)
        .single()

      if (bookingError || !booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found.',
        })
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authenticatedRequest.user.id)
        .single()

      if (profileError || !profile) {
        return res.status(404).json({
          success: false,
          message: 'Customer profile not found.',
        })
      }

      const service: unknown = booking.service

      if (
        !service ||
        typeof service !== 'object' ||
        !('name' in service) ||
        typeof service.name !== 'string' ||
        !service.name
      ) {
        return res.status(422).json({
          success: false,
          message: 'Booking service information is unavailable.',
        })
      }

      const result = await sendBookingConfirmationEmail({
        to: authenticatedRequest.user.email,
        customerName: profile.full_name,
        serviceName: service.name,
        appointmentDate: booking.appointment_date,
        appointmentTime: booking.appointment_time,
        status: booking.status,
      })

      return res.status(200).json({
        success: true,
        message: 'Booking confirmation sent.',
        emailId: result?.id ?? null,
      })
    } catch (error) {
      console.error('Booking confirmation failed:', error)

      return res.status(502).json({
        success: false,
        message: 'Failed to send booking confirmation.',
      })
    }
  },
)
