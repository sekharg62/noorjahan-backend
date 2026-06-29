import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth";
import { create, getAll, getOne } from "./product.controller";

const router = Router();

router.get("/", getAll);
router.get("/:slug", getOne);
router.post("/", adminAuth, create);

export default router;
