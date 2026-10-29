import { AuditLog } from "../models/AuditLog";

interface CreateAuditLogInput {
  user_id: string;
  file_id?: string;
  action: string;
  transaction_reference?: string;
}

export const createAuditLog = async (
  data: CreateAuditLogInput
) => {
  const auditLog = new AuditLog({
    user_id: data.user_id,
    file_id: data.file_id,
    action: data.action,
    timestamp: new Date(),
    transaction_reference:
      data.transaction_reference,
  });

  return auditLog.save();
};