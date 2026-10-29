import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IFile extends Document {
  file_id: string;
  vault_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_reference: string;
  sha256_hash: string;
  file_status: string;
  uploaded_at: Date;
}

const FileSchema = new Schema<IFile>(
  {
    file_id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
      required: true,
    },

    vault_id: {
      type: String,
      required: true,
      index: true,
    },

    file_name: {
      type: String,
      required: true,
      trim: true,
    },

    file_type: {
      type: String,
      required: true,
      trim: true,
    },

    file_size: {
      type: Number,
      required: true,
      min: 0,
    },

    storage_reference: {
      type: String,
      required: true,
    },

    sha256_hash: {
      type: String,
      required: true,
    },

    file_status: {
      type: String,
      required: true,
      default: "ACTIVE",
    },

    uploaded_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "files",
  }
);

export const File = mongoose.model<IFile>("File", FileSchema);