import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth";
import { create } from "./productImage.controller";

const router = Router();

router.post("/", adminAuth, create);

export default router;
