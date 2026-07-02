import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth";
import { getDashboard, getSales } from "./dashboard.controller";

const router = Router();

router.get("/sales", adminAuth, getSales);
router.get("/", adminAuth, getDashboard);

export default router;
