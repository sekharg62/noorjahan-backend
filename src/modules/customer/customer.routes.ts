import { Router } from "express";
import { customerAuth } from "../../middleware/customerAuth";
import addressRoutes from "./address/address.routes";
import { getMe } from "./customer.controller";
import { getMyOrders } from "../order/order.controller";
import authRoutes from "./auth/auth.routes";

const router = Router();

router.use("/auth", authRoutes);
router.get("/me", customerAuth, getMe);
router.get("/me/orders", customerAuth, getMyOrders);
router.use("/me/addresses", addressRoutes);

export default router;
