-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HOME', 'CATEGORY', 'PRODUCT');

-- CreateTable
CREATE TABLE "banners" (
    "id" UUID NOT NULL,
    "img_url" TEXT NOT NULL,
    "redirect_url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "BannerType" NOT NULL DEFAULT 'HOME',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banners_order_key" ON "banners"("order");
