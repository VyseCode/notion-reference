import { randomBytes } from "crypto";
import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IPage {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  icon: string;
  coverColor: string;
  parentId: Types.ObjectId | null;
  favorite: boolean;
  published: boolean;
  publicSlug: string;
  createdAt: Date;
  updatedAt: Date;
}

export function generatePublicSlug(): string {
  return randomBytes(12).toString("base64url").toLowerCase();
}

const pageSchema = new Schema<IPage>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "Untitled", trim: true, maxlength: 200 },
    icon: { type: String, default: "" },
    coverColor: { type: String, default: "" },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Page",
      default: null,
      index: true,
    },
    favorite: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: false, index: true },
    publicSlug: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

pageSchema.index({ owner: 1, parentId: 1 });
pageSchema.index({ owner: 1, updatedAt: -1 });
pageSchema.index({ owner: 1, favorite: 1, updatedAt: -1 });

export const Page: Model<IPage> =
  (models.Page as Model<IPage>) || model<IPage>("Page", pageSchema);
