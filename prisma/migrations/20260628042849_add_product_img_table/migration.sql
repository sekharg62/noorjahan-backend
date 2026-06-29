-- CreateTable
CREATE TABLE "product_img" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "img_url" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_img_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_img_product_id_idx" ON "product_img"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_img_product_id_display_order_key" ON "product_img"("product_id", "display_order");

-- CreateIndex (only one primary image per product)
CREATE UNIQUE INDEX "product_img_one_primary_per_product_idx" ON "product_img"("product_id") WHERE "is_primary" = true;

-- AddForeignKey
ALTER TABLE "product_img" ADD CONSTRAINT "product_img_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
