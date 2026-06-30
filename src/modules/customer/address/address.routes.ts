import { Router } from "express";
import { customerAuth } from "../../../middleware/customerAuth";
import { create, remove, update } from "./address.controller";

const router = Router();

router.post("/", customerAuth, create);
router.put("/:id", customerAuth, update);
router.delete("/:id", customerAuth, remove);

export default router;
