import { Router } from "express";
import { adminAuth } from "../../../middleware/adminAuth";
import { create, getAll, patch, remove, sync } from "./categorySize.controller";

const router = Router({ mergeParams: true });

router.get("/", getAll);
router.post("/", adminAuth, create);
router.put("/", adminAuth, sync);
router.patch("/:categorySizeId", adminAuth, patch);
router.delete("/:categorySizeId", adminAuth, remove);

export default router;
