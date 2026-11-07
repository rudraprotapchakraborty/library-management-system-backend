import { Schema, model, Document } from "mongoose";

export const GENRES = ["FICTION", "NON_FICTION", "SCIENCE", "HISTORY", "BIOGRAPHY", "FANTASY"] as const;
export type Genre = (typeof GENRES)[number];

export interface IBook extends Document {
  title: string;
  author: string;
  genre: Genre;
  isbn: string;
  description?: string;
  coverImageUrl?: string;
  publishedYear?: number;
  copies: number;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
  updateAvailability(): void;
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    genre: { type: String, enum: GENRES, required: true },
    isbn: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    coverImageUrl: { type: String },
    publishedYear: { type: Number },
    copies: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bookSchema.index({ title: "text", author: "text" });

// Business rule: a book with no copies left is unavailable.
bookSchema.methods.updateAvailability = function () {
  this.available = this.copies > 0;
};

bookSchema.pre<IBook>("save", function () {
  this.updateAvailability();
});

export const Book = model<IBook>("Book", bookSchema);
