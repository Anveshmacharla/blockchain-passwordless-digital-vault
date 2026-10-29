import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IBlockchainRecord extends Document {
  blockchain_record_id: string;
  file_id: string;
  transaction_hash: string;
  sha256_hash: string;
  owner_address: string;
  smart_contract_reference: string;
  timestamp: Date;
  blockchain_status: string;
}

const BlockchainRecordSchema = new Schema<IBlockchainRecord>(
  {
    blockchain_record_id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
      required: true,
    },

    file_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    transaction_hash: {
      type: String,
      required: true,
    },

    sha256_hash: {
      type: String,
      required: true,
    },

    owner_address: {
      type: String,
      required: true,
    },

    smart_contract_reference: {
      type: String,
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },

    blockchain_status: {
      type: String,
      required: true,
      default: "ACTIVE",
    },
  },
  {
    collection: "blockchain_records",
  }
);

export const BlockchainRecord = mongoose.model<IBlockchainRecord>(
  "BlockchainRecord",
  BlockchainRecordSchema
);