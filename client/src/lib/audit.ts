import { supabase } from './supabase'

type AuditDetails = Record<string, unknown>

type LogAuditParams = {
  action: string
  entityType?: string
  entityId?: string
  details?: AuditDetails
}

export async function logAudit({
  action,
  entityType,
  entityId,
  details,
}: LogAuditParams) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('Audit log skipped: no authenticated user')
    return
  }

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: user.id,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      details: details ?? {},
    })

  if (error) {
    console.error('Failed to create audit log:', error)
  }
}