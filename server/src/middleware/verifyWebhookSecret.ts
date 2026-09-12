import type { NextFunction, Request, Response } from 'express'

export function verifyWebhookSecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const configuredSecret = process.env.NOTIFICATION_WEBHOOK_SECRET

  if (!configuredSecret) {
    return res.status(500).json({
      success: false,
      message: 'Notification webhook secret is not configured.',
    })
  }

  const providedSecret = req.header('x-webhook-secret')

  if (!providedSecret || providedSecret !== configuredSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized.',
    })
  }

  next()
}
