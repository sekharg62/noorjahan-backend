import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth";
import { getDashboard } from "./dashboard.controller";

const router = Router();

router.get("/", adminAuth, getDashboard);

export default router;
