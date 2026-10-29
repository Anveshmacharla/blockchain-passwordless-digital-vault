import { SecurityAlert } from "../models/SecurityAlert";

interface CreateSecurityAlertInput {
  user_id?: string;
  file_id?: string;
  alert_type: string;
  description: string;
  severity: string;
}

export const createSecurityAlert = async (
  data: CreateSecurityAlertInput
) => {
  const securityAlert = new SecurityAlert({
    user_id: data.user_id,
    file_id: data.file_id,
    alert_type: data.alert_type,
    description: data.description,
    severity: data.severity,
    created_at: new Date(),
    alert_status: "OPEN",
  });

  return securityAlert.save();
};