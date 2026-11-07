import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";
import bookRoutes from "../modules/books/book.routes";
import borrowRoutes from "../modules/borrow/borrow.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import adminRoutes from "../modules/admin/admin.routes";
import uploadRoutes from "../modules/uploads/upload.routes";
import publicRoutes from "../modules/public/public.routes";
import { apiLimiter } from "../core/rate-limit";

const router = Router();

router.use(apiLimiter);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/books", bookRoutes);
router.use("/borrow", borrowRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);
router.use("/uploads", uploadRoutes);
router.use("/public", publicRoutes);

export default router;
