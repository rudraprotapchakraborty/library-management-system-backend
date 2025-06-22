import { Schema, model, Document } from 'mongoose';

export type Genre =
  | 'FICTION'
  | 'NON_FICTION'
  | 'SCIENCE'
  | 'HISTORY'
  | 'BIOGRAPHY'
  | 'FANTASY';

export interface IBook extends Document {
  title: string;
  author: string;
  genre: Genre;
  isbn: string;
  description?: string;
  copies: number;
  available: boolean;
  updateAvailability(): void;
}

const bookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: {
      type: String,
      enum: ['FICTION', 'NON_FICTION', 'SCIENCE', 'HISTORY', 'BIOGRAPHY', 'FANTASY'],
      required: true,
    },
    isbn: { type: String, required: true, unique: true },
    description: { type: String },
    copies: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bookSchema.methods.updateAvailability = function () {
  this.available = this.copies > 0;
};

bookSchema.pre<IBook>('save', function (next) {
  this.updateAvailability();
  next();
});

export const Book = model<IBook>('Book', bookSchema);
