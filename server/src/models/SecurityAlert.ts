import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface ISecurityAlert extends Document {
  alert_id: string;
  user_id?: string;
  file_id?: string;
  alert_type: string;
  description: string;
  severity: string;
  created_at: Date;
  alert_status: "OPEN" | "REVIEWED" | "RESOLVED";
}

const SecurityAlertSchema = new Schema<ISecurityAlert>(
  {
    alert_id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
      required: true,
    },

    user_id: {
      type: String,
      index: true,
    },

    file_id: {
      type: String,
      index: true,
    },

    alert_type: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    severity: {
      type: String,
      required: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },

    alert_status: {
      type: String,
      enum: ["OPEN", "REVIEWED", "RESOLVED"],
      required: true,
      default: "OPEN",
    },
  },
  {
    collection: "security_alerts",
  }
);

export const SecurityAlert = mongoose.model<ISecurityAlert>(
  "SecurityAlert",
  SecurityAlertSchema
);