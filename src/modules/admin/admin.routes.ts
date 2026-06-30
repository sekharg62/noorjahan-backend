import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import adminCustomerRoutes from "./customers/admin.customers.routes";
import adminOrderRoutes from "./orders/admin.orders.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/customers", adminCustomerRoutes);
router.use("/orders", adminOrderRoutes);

export default router;
