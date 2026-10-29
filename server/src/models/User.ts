import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IUser extends Document {
  user_id: string;
  name: string;
  email: string;
  role: string;
  authentication_credential: Record<string, unknown>;
  account_status: string;
  created_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
    },

    authentication_credential: {
      type: Schema.Types.Mixed,
      default: {},
    },

    account_status: {
      type: String,
      required: true,
      default: "ACTIVE",
    },

    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "users",
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);