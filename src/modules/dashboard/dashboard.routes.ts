import { Router, Response } from "express";
import { Types } from "mongoose";
import { AuthRequest, authMiddleware } from "../../core/auth-middleware";
import { Borrow } from "../../models/Borrow";

const router = Router();
router.use(authMiddleware);

/** The numbers on a reader's dashboard home. */
router.get("/summary", async (req: AuthRequest, res: Response) => {
  const user = new Types.ObjectId(req.user!.id);
  const now = new Date();
  const [onLoan, overdue, returned, all, next] = await Promise.all([
    Borrow.aggregate([{ $match: { user, returnedAt: { $exists: false } } }, { $group: { _id: null, total: { $sum: "$quantity" } } }]),
    Borrow.countDocuments({ user, returnedAt: { $exists: false }, dueDate: { $lt: now } }),
    Borrow.countDocuments({ user, returnedAt: { $exists: true } }),
    Borrow.countDocuments({ user }),
    Borrow.findOne({ user, returnedAt: { $exists: false } }).sort({ dueDate: 1 }).select("dueDate"),
  ]);
  res.json({
    success: true,
    data: { copiesOnLoan: onLoan[0]?.total ?? 0, overdue, returned, totalLoans: all, nextDue: next?.dueDate ?? null },
  });
});

export default router;
