import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth";
import categorySizeRoutes from "./categorySize/categorySize.routes";
import {
  create,
  getAll,
  getOne,
  patch,
  remove,
  update,
} from "./menuSubmenu.controller";

const router = Router();

router.get("/", getAll);
router.use("/:menuSubmenuId/sizes", categorySizeRoutes);
router.get("/:id", getOne);

router.post("/", adminAuth, create);
router.put("/:id", adminAuth, update);
router.patch("/:id", adminAuth, patch);
router.delete("/:id", adminAuth, remove);

export default router;
