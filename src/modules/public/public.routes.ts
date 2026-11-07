import { Router } from "express";
import { Book } from "../../models/Book";
import { Borrow } from "../../models/Borrow";
import { User } from "../../models/User";

const router = Router();

/** Aggregate counts only (no personal data) for the landing page. */
router.get("/stats", async (_req, res) => {
  const [titles, copies, readers, borrowed] = await Promise.all([
    Book.countDocuments(),
    Book.aggregate([{ $group: { _id: null, total: { $sum: "$copies" } } }]),
    User.countDocuments({ emailVerified: true, isBlocked: false }),
    Borrow.countDocuments(),
  ]);
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ success: true, data: { titles, copies: copies[0]?.total ?? 0, readers, borrowed } });
});

export default router;
