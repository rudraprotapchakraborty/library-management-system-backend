import { HydratedDocument } from "mongoose";
import { IUser } from "../../models/User";
import { Book } from "../../models/Book";
import { Borrow } from "../../models/Borrow";

/**
 * Deletes a reader. Copies they still hold go back on the shelf first, so
 * removing an account never makes books disappear from the library.
 */
export const deleteUserAndContent = async (user: HydratedDocument<IUser>) => {
  const open = await Borrow.find({ user: user._id, returnedAt: { $exists: false } });
  for (const loan of open) {
    const book = await Book.findById(loan.book);
    if (book) {
      book.copies += loan.quantity;
      book.updateAvailability();
      await book.save();
    }
  }
  await Borrow.deleteMany({ user: user._id });
  await user.deleteOne();
};
