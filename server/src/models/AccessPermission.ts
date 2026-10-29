import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IAccessPermission extends Document {
  permission_id: string;
  file_id: string;
  user_id: string;
  permission_type: "VIEW" | "DOWNLOAD" | "MANAGE";
  permission_status: string;
  expiry_date: Date;
  granted_at: Date;
  revoked_at?: Date;
}

const AccessPermissionSchema = new Schema<IAccessPermission>(
  {
    permission_id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
      required: true,
    },

    file_id: {
      type: String,
      required: true,
      index: true,
    },

    user_id: {
      type: String,
      required: true,
      index: true,
    },

    permission_type: {
      type: String,
      enum: ["VIEW", "DOWNLOAD", "MANAGE"],
      required: true,
    },

    permission_status: {
      type: String,
      required: true,
      default: "ACTIVE",
    },

    expiry_date: {
      type: Date,
      required: true,
    },

    granted_at: {
      type: Date,
      default: Date.now,
      required: true,
    },

    revoked_at: {
      type: Date,
      required: false,
    },
  },
  {
    collection: "access_permissions",
  }
);

AccessPermissionSchema.index(
  { file_id: 1, user_id: 1 },
  { unique: true }
);

export const AccessPermission = mongoose.model<IAccessPermission>(
  "AccessPermission",
  AccessPermissionSchema
);