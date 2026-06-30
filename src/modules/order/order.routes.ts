import { Router } from "express";
import { optionalCustomerAuth } from "../../middleware/customerAuth";
import { create, getByOrderNo } from "./order.controller";

const router = Router();

router.post("/", optionalCustomerAuth, create);
router.get("/:orderNo", getByOrderNo);

export default router;
