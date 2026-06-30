import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth";
import { create, getAll, getOne, patch, remove, search } from "./product.controller";

const router = Router();

router.get("/", getAll);
router.get("/search", search);
router.post("/", adminAuth, create);
router.patch("/:id", adminAuth, patch);
router.delete("/:id", adminAuth, remove);
router.get("/:slug", getOne);

export default router;
