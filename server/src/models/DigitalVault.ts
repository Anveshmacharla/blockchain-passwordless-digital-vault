import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IDigitalVault extends Document {
  vault_id: string;
  user_id: string;
  vault_name: string;
  created_at: Date;
  vault_status: string;
}

const DigitalVaultSchema = new Schema<IDigitalVault>(
  {
    vault_id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
      required: true,
    },

    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    vault_name: {
      type: String,
      required: true,
      trim: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },

    vault_status: {
      type: String,
      required: true,
      default: "ACTIVE",
    },
  },
  {
    collection: "digital_vaults",
  }
);

export const DigitalVault = mongoose.model<IDigitalVault>(
  "DigitalVault",
  DigitalVaultSchema
);