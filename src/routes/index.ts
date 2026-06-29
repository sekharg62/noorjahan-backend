import { Router } from "express";
import adminRoutes from "../modules/admin/admin.routes";
import bannerRoutes from "../modules/banners/banner.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import menuSubmenuRoutes from "../modules/menuSubmenu/menuSubmenu.routes";
import productImageRoutes from "../modules/productImage/productImage.routes";
import productRoutes from "../modules/product/product.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/admin", adminRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/menu-submenu", menuSubmenuRoutes);
router.use("/products", productRoutes);
router.use("/product-images", productImageRoutes);
router.use("/banners", bannerRoutes);

export default router;
