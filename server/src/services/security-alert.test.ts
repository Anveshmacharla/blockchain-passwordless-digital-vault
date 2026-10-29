import "dotenv/config";

import mongoose from "mongoose";
import { createSecurityAlert } from "./security-alert.service";

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

  console.log("\n2. Creating security alert...");

  const alert = await createSecurityAlert({
    user_id: "security-test-user",
    file_id: "security-test-file",
    alert_type: "INTEGRITY_MISMATCH",
    description:
      "Test security alert for blockchain integrity verification.",
    severity: "HIGH",
  });

  console.log("Security alert created.");
  console.log("Alert ID:", alert.alert_id);
  console.log("User ID:", alert.user_id);
  console.log("File ID:", alert.file_id);
  console.log("Alert type:", alert.alert_type);
  console.log("Description:", alert.description);
  console.log("Severity:", alert.severity);
  console.log("Alert status:", alert.alert_status);
  console.log(
    "Created at:",
    alert.created_at.toISOString()
  );

  await mongoose.disconnect();

  console.log(
    "\nSecurity alert service test PASSED."
  );
}

main().catch(async (error) => {
  console.error(
    "Security alert service test FAILED:"
  );
  console.error(error);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exitCode = 1;
});