import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("password", 10);

  await prisma.admin.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      name: "Admin",
      passwordHash,
      role: "admin",
    },
    create: {
      name: "Admin",
      email: "admin@gmail.com",
      passwordHash,
      role: "admin",
    },
  });

  console.log("Seeded admin user:");
  console.log("  Email: admin@gmail.com");
  console.log("  Password: password");

  const women = await prisma.menuSubmenu.upsert({
    where: { slug: "women" },
    update: { name: "Women", parentId: null },
    create: { name: "Women", slug: "women", parentId: null },
  });

  const men = await prisma.menuSubmenu.upsert({
    where: { slug: "men" },
    update: { name: "Men", parentId: null },
    create: { name: "Men", slug: "men", parentId: null },
  });

  const submenus = [
    { name: "Kurti", slug: "kurti", parentId: women.id },
    { name: "Bra", slug: "bra", parentId: women.id },
    { name: "Saree", slug: "saree", parentId: women.id },
    { name: "T-Shirt", slug: "t-shirt", parentId: men.id },
  ];

  for (const item of submenus) {
    await prisma.menuSubmenu.upsert({
      where: { slug: item.slug },
      update: { name: item.name, parentId: item.parentId },
      create: item,
    });
  }

  console.log("Seeded menu/submenu items");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
