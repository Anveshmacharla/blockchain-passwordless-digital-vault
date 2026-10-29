import "dotenv/config";

import mongoose from "mongoose";
import { createAuditLog } from "./audit.service";

async function main() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not defined"
    );
  }

  console.log("1. Connecting to MongoDB...");

  await mongoose.connect(mongoUri);

  console.log("MongoDB connected.");

  console.log("\n2. Creating audit log...");

  const auditLog = await createAuditLog({
    user_id: "audit-test-user",
    file_id: "audit-test-file",
    action: "AUDIT_TEST",
    transaction_reference:
      "audit-test-transaction",
  });

  console.log("Audit log created.");
  console.log("Audit ID:", auditLog.audit_id);
  console.log("User ID:", auditLog.user_id);
  console.log("File ID:", auditLog.file_id);
  console.log("Action:", auditLog.action);
  console.log(
    "Transaction reference:",
    auditLog.transaction_reference
  );
  console.log(
    "Timestamp:",
    auditLog.timestamp.toISOString()
  );

  await mongoose.disconnect();

  console.log("\nAudit service test PASSED.");
}

main().catch(async (error) => {
  console.error("Audit service test FAILED:");
  console.error(error);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exitCode = 1;
});