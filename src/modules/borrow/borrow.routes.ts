import { Router, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { AuthRequest, authMiddleware } from "../../core/auth-middleware";
import { HttpException } from "../../core/http-exception";
import { objectIdSchema } from "../../core/object-id";
import { requireRole } from "../../core/role-middleware";
import { validateRequest } from "../../core/validate-request";
import { Book } from "../../models/Book";
import { Borrow, IBorrow } from "../../models/Borrow";

const router = Router();
router.use(authMiddleware);

const ok = (message: string, data: unknown) => ({ success: true, message, data });

const borrowSchema = z.object({
  body: z.object({
    book: objectIdSchema,
    quantity: z.number().int().min(1).max(20),
    dueDate: z.coerce.date(),
  }),
});
const idSchema = z.object({ params: z.object({ id: objectIdSchema }) });

type PopulatedBorrow = Omit<IBorrow, "book"> & { book: { _id: Types.ObjectId; title: string; author: string; isbn: string; coverImageUrl?: string } | null };

const shapeLoan = (b: PopulatedBorrow) => ({
  id: String(b._id),
  quantity: b.quantity,
  dueDate: b.dueDate,
  borrowedAt: b.createdAt,
  returnedAt: b.returnedAt ?? null,
  overdue: !b.returnedAt && b.dueDate.getTime() < Date.now(),
  book: b.book && { id: String(b.book._id), title: b.book.title, author: b.book.author, isbn: b.book.isbn, coverImageUrl: b.book.coverImageUrl },
});

/** Borrow copies of a book. Same rules as ever: the book must exist and have enough copies. */
router.post("/", validateRequest(borrowSchema), async (req: AuthRequest, res: Response) => {
  const { book: bookId, quantity, dueDate } = req.body as { book: string; quantity: number; dueDate: Date };
  if (dueDate.getTime() <= Date.now()) throw new HttpException(400, "The due date must be in the future");

  const book = await Book.findById(bookId);
  if (!book) throw new HttpException(404, "Book not found");
  if (book.copies < quantity) throw new HttpException(400, "Not enough copies available");

  book.copies -= quantity;
  book.updateAvailability();
  await book.save();

  const borrow = await Borrow.create({ book: book._id, user: req.user!.id, quantity, dueDate });
  res.status(201).json(ok("Book borrowed successfully", borrow));
});

/** The signed-in reader's loans, current first. */
router.get("/mine", async (req: AuthRequest, res: Response) => {
  const rows = await Borrow.find({ user: req.user!.id })
    .sort({ returnedAt: 1, dueDate: 1 })
    .limit(200)
    .populate<{ book: PopulatedBorrow["book"] }>("book", "title author isbn coverImageUrl");
  res.json(ok("Your loans retrieved successfully", rows.map((r) => shapeLoan(r as unknown as PopulatedBorrow))));
});

/** Brings copies back: they return to the shelf and the book is available again. */
router.post("/:id/return", validateRequest(idSchema), async (req: AuthRequest, res: Response) => {
  const borrow = await Borrow.findOne({ _id: req.params.id, user: req.user!.id });
  if (!borrow) throw new HttpException(404, "Loan not found");
  if (borrow.returnedAt) throw new HttpException(400, "These copies were already returned");

  borrow.returnedAt = new Date();
  await borrow.save();

  const book = await Book.findById(borrow.book);
  if (book) {
    book.copies += borrow.quantity;
    book.updateAvailability();
    await book.save();
  }
  res.json(ok("Book returned successfully", { id: String(borrow._id), returnedAt: borrow.returnedAt }));
});

/** Librarians: borrowed books summary (the original aggregation: total copies borrowed per book). */
router.get("/", requireRole("ADMIN"), async (_req: AuthRequest, res: Response) => {
  const summary = await Borrow.aggregate([
    { $group: { _id: "$book", totalQuantity: { $sum: "$quantity" } } },
    { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "bookDetails" } },
    { $unwind: "$bookDetails" },
    { $project: { _id: 0, totalQuantity: 1, book: { title: "$bookDetails.title", isbn: "$bookDetails.isbn" } } },
    { $sort: { totalQuantity: -1 } },
  ]);
  res.json(ok("Borrowed books summary retrieved successfully", summary));
});

/** Librarians: every active loan with who has it and when it is due. */
router.get("/active", requireRole("ADMIN"), async (_req: AuthRequest, res: Response) => {
  const rows = await Borrow.find({ returnedAt: { $exists: false } })
    .sort({ dueDate: 1 })
    .limit(200)
    .populate<{ book: PopulatedBorrow["book"] }>("book", "title author isbn coverImageUrl")
    .populate<{ user: { fullName: string; email: string } | null }>("user", "fullName email");
  res.json(
    ok(
      "Active loans retrieved successfully",
      rows.map((r) => ({ ...shapeLoan(r as unknown as PopulatedBorrow), reader: (r.user as unknown as { fullName: string; email: string } | null) ?? null }))
    )
  );
});

export default router;
