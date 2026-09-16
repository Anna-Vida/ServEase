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
  const { error } = await supabase.rpc(
    'log_audit_event',
    {
      p_action: action,
      p_entity_type: entityType ?? null,
      p_entity_id: entityId ?? null,
      p_details: details ?? {},
    }
  )

  if (error) {
    console.error('Failed to create audit log:', error)
  }
}
