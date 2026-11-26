import { Schema, model, models, type Model, type Types } from "mongoose";
import { BLOCK_TYPES, type BlockType } from "@/lib/types";

export interface IBlock {
  _id: Types.ObjectId;
  page: Types.ObjectId;
  type: BlockType;
  content: string;
  checked: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const blockSchema = new Schema<IBlock>(
  {
    page: {
      type: Schema.Types.ObjectId,
      ref: "Page",
      required: true,
      index: true,
    },
    type: { type: String, enum: BLOCK_TYPES, default: "paragraph" },
    content: { type: String, default: "", maxlength: 20000 },
    checked: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

blockSchema.index({ page: 1, order: 1, _id: 1 });

export const Block: Model<IBlock> =
  (models.Block as Model<IBlock>) || model<IBlock>("Block", blockSchema);
