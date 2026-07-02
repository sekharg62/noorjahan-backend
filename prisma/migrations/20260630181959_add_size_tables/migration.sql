/*
  Warnings:

  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "stock";

-- CreateTable
CREATE TABLE "sizes" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_sizes" (
    "id" UUID NOT NULL,
    "menu_submenu_id" UUID NOT NULL,
    "size_id" UUID NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_sizes" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "size_id" UUID NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sizes_label_key" ON "sizes"("label");

-- CreateIndex
CREATE INDEX "category_sizes_menu_submenu_id_idx" ON "category_sizes"("menu_submenu_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_sizes_menu_submenu_id_size_id_key" ON "category_sizes"("menu_submenu_id", "size_id");

-- CreateIndex
CREATE INDEX "product_sizes_product_id_idx" ON "product_sizes"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_sizes_product_id_size_id_key" ON "product_sizes"("product_id", "size_id");

-- AddForeignKey
ALTER TABLE "category_sizes" ADD CONSTRAINT "category_sizes_menu_submenu_id_fkey" FOREIGN KEY ("menu_submenu_id") REFERENCES "menu_submenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_sizes" ADD CONSTRAINT "category_sizes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
