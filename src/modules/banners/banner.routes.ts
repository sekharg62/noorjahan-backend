import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth";
import { create, getAll, remove, update } from "./banner.controller";

const router = Router();

router.get("/", getAll);
router.post("/", adminAuth, create);
router.put("/:id", adminAuth, update);
router.delete("/:id", adminAuth, remove);

export default router;
