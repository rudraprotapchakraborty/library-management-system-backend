import { Schema, model, Document, Types } from "mongoose";

export interface IBorrow extends Document {
  book: Types.ObjectId;
  user: Types.ObjectId;
  quantity: number;
  dueDate: Date;
  /** Set when the copies are brought back */
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const borrowSchema = new Schema<IBorrow>(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date },
  },
  { timestamps: true }
);

export const Borrow = model<IBorrow>("Borrow", borrowSchema);
