import { Borrow } from '../models/borrow.model';
import { Book } from '../models/book.model';

export const borrowBookService = async (
  bookId: string,
  quantity: number,
  dueDate: Date
) => {
  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error('Book not found');
  }
  if (book.copies < quantity) {
    throw new Error('Not enough copies available');
  }

  book.copies -= quantity;
  book.updateAvailability();
  await book.save();

  return Borrow.create({ book: book._id, quantity, dueDate });
};

export const getBorrowSummaryService = () =>
  Borrow.aggregate([
    {
      $group: {
        _id: '$book',
        totalQuantity: { $sum: '$quantity' },
      },
    },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'bookDetails',
      },
    },
    { $unwind: '$bookDetails' },
    {
      $project: {
        _id: 0,
        totalQuantity: 1,
        book: {
          title: '$bookDetails.title',
          isbn: '$bookDetails.isbn',
        },
      },
    },
  ]);
