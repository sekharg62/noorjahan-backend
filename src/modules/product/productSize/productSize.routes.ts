import { Router } from "express";
import { adminAuth } from "../../../middleware/adminAuth";
import { create, getAll, patch, remove, sync } from "./productSize.controller";

const router = Router({ mergeParams: true });

router.get("/", getAll);
router.post("/", adminAuth, create);
router.put("/", adminAuth, sync);
router.patch("/:productSizeId", adminAuth, patch);
router.delete("/:productSizeId", adminAuth, remove);

export default router;
