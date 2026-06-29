import { prisma } from "../../config/database";

export async function getDashboardStats() {
  const [totalMenuItems, totalSubmenuItems, totalProducts, totalProductImages] =
    await Promise.all([
      prisma.menuSubmenu.count({ where: { parentId: null } }),
      prisma.menuSubmenu.count({ where: { parentId: { not: null } } }),
      prisma.product.count(),
      prisma.productImage.count(),
    ]);

  return {
    totalMenuItems,
    totalSubmenuItems,
    totalProducts,
    totalProductImages,
  };
}
