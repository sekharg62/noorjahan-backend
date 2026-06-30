import { Router } from "express";
import { adminAuth } from "../../../middleware/adminAuth";
import { getAllAdmin, updateStatus } from "../../order/order.controller";

const router = Router();

router.get("/", adminAuth, getAllAdmin);
router.patch("/:id", adminAuth, updateStatus);

export default router;
