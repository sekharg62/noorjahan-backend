import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth";
import { create, getAll } from "./product.controller";

const router = Router();

router.get("/", getAll);
router.post("/", adminAuth, create);

export default router;
