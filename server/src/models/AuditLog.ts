import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IAuditLog extends Document {
  audit_id: string;
  user_id: string;
  file_id: string;
  action: string;
  timestamp: Date;
  transaction_reference: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    audit_id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
      required: true,
    },

    user_id: {
      type: String,
      required: true,
      index: true,
    },

    file_id: {
      type: String,
      required: false,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },

    transaction_reference: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    collection: "audit_logs",
  }
);

export const AuditLog = mongoose.model<IAuditLog>(
  "AuditLog",
  AuditLogSchema
);