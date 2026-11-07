import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../../core/auth-middleware";
import { HttpException } from "../../core/http-exception";
import { escapeRegex, objectIdSchema } from "../../core/object-id";
import { requireRole } from "../../core/role-middleware";
import { validateRequest } from "../../core/validate-request";
import { Book, GENRES } from "../../models/Book";
import { Borrow } from "../../models/Borrow";

const router = Router();

const ok = (message: string, data: unknown, extra: Record<string, unknown> = {}) => ({ success: true, message, data, ...extra });

const bookBody = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(120),
  genre: z.enum(GENRES),
  isbn: z.string().trim().min(5).max(30),
  description: z.string().trim().max(4000).optional(),
  coverImageUrl: z.union([z.url().max(600), z.literal("")]).optional(),
  publishedYear: z.number().int().min(0).max(2100).optional(),
  copies: z.number().int().min(0),
  available: z.boolean().optional(),
});

const createSchema = z.object({ body: bookBody });
const updateSchema = z.object({ params: z.object({ bookId: objectIdSchema }), body: bookBody.partial() });
const idSchema = z.object({ params: z.object({ bookId: objectIdSchema }) });

const clampInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
};

/**
 * All books. Supports the original query: `filter` (genre), `sortBy`, `sort`
 * (asc | desc) and `limit`, plus `q` (title / author search), `available` and `page`.
 */
router.get("/", async (req: Request, res: Response) => {
  const { filter, sortBy = "createdAt", sort = "asc", q, available } = req.query as Record<string, string | undefined>;
  const limit = clampInt(req.query.limit, 10, 1, 100);
  const page = clampInt(req.query.page, 1, 1, 10_000);

  const dbQuery: Record<string, unknown> = {};
  if (filter && (GENRES as readonly string[]).includes(filter)) dbQuery.genre = filter;
  if (available === "true") dbQuery.available = true;
  const term = typeof q === "string" ? q.trim().slice(0, 80) : "";
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    dbQuery.$or = [{ title: rx }, { author: rx }, { isbn: rx }];
  }

  const sortable = ["createdAt", "title", "author", "copies", "publishedYear"];
  const key = sortable.includes(sortBy) ? sortBy : "createdAt";

  const [books, total] = await Promise.all([
    Book.find(dbQuery)
      .sort({ [key]: sort === "desc" ? -1 : 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Book.countDocuments(dbQuery),
  ]);

  res.json(ok("Books retrieved successfully", books, { meta: { total, page, pages: Math.max(1, Math.ceil(total / limit)), limit } }));
});

router.get("/:bookId", validateRequest(idSchema), async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) throw new HttpException(404, "Book not found");
  res.json(ok("Book retrieved successfully", book));
});

router.post("/", authMiddleware, requireRole("ADMIN"), validateRequest(createSchema), async (req: Request, res: Response) => {
  const book = await Book.create(req.body);
  res.status(201).json(ok("Book created successfully", book));
});

router.put("/:bookId", authMiddleware, requireRole("ADMIN"), validateRequest(updateSchema), async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) throw new HttpException(404, "Book not found");
  book.set(req.body);
  await book.save(); // runs the availability rule
  res.json(ok("Book updated successfully", book));
});

router.delete("/:bookId", authMiddleware, requireRole("ADMIN"), validateRequest(idSchema), async (req: Request, res: Response) => {
  const active = await Borrow.countDocuments({ book: req.params.bookId, returnedAt: { $exists: false } });
  if (active > 0) throw new HttpException(409, "Copies of this book are still on loan. Wait until they are returned.");
  const deleted = await Book.findByIdAndDelete(req.params.bookId);
  if (!deleted) throw new HttpException(404, "Book not found");
  res.json(ok("Book deleted successfully", null));
});

export default router;
