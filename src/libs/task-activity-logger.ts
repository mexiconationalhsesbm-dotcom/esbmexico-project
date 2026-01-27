import { createClient } from "@/utils/supabase/server"

export type ActivityRemark =
  | 'Created'
  | 'Edited'
  | 'Deleted'
  | 'Accepted'
  | 'For Revision'
  | 'Rejected'
  | 'Late'
  | 'On time';

interface LogActivityParams {
  taskId: number | string;
  folderId: string;
  dimensionId: string;
  action: string;
  actorId: string;
  actorRole: string;
  description: string;
  remarks: ActivityRemark;
  metadata?: Record<string, any>;
  due: string;
}

export async function logTaskActivity(params: LogActivityParams) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('task_activity_logs').insert({
      task_id: params.taskId,
      folder_id: params.folderId,
      dimension_id: params.dimensionId,
      action: params.action,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      description: params.description,
      remarks: params.remarks,
      metadata: params.metadata || null,
      due: params.due,
    });

    if (error) {
      console.error('[v0] Error logging task activity:', error);
    }
  } catch (error) {
    console.error('[v0] Error logging task activity:', error);
    // Don't throw - activity logging shouldn't break the main operation
  }
}

export function checkIfLate(dueDate: string, submissionDate: string): boolean {
  const due = new Date(dueDate);
  const submitted = new Date(submissionDate);
  return submitted > due;
}
