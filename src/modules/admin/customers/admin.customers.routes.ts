import { Router } from "express";
import { adminAuth } from "../../../middleware/adminAuth";
import { getAll } from "./admin.customers.controller";

const router = Router();

router.get("/", adminAuth, getAll);

export default router;
