-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "menu_submenu_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT NOT NULL,
    "offer_price" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_menu_submenu_id_idx" ON "products"("menu_submenu_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_menu_submenu_id_fkey" FOREIGN KEY ("menu_submenu_id") REFERENCES "menu_submenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
