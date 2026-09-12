import type { NextFunction, Request, Response } from 'express'
import { createSupabaseClient } from '../lib/supabase.js'

export type AuthenticatedRequest = Request & {
  user: {
    id: string
    email: string | null
  }
  accessToken: string
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.header('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  const accessToken = authorization.slice(7)

  const supabase = createSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    })
  }

  const authenticatedRequest = req as AuthenticatedRequest

  authenticatedRequest.user = {
    id: user.id,
    email: user.email ?? null,
  }

  authenticatedRequest.accessToken = accessToken

  next()
}
