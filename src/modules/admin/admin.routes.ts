import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import adminOrderRoutes from "./orders/admin.orders.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/orders", adminOrderRoutes);

export default router;
