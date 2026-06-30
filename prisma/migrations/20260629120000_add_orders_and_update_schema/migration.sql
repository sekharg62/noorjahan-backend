-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'ONLINE');

-- AlterTable customers
ALTER TABLE "customers" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable customer_address
ALTER TABLE "customer_address" ADD COLUMN "full_name" TEXT;
ALTER TABLE "customer_address" ADD COLUMN "phone" TEXT;

UPDATE "customer_address" SET
  "full_name" = COALESCE("full_name", 'Customer'),
  "phone" = COALESCE("phone", '0000000000');

ALTER TABLE "customer_address" ALTER COLUMN "full_name" SET NOT NULL;
ALTER TABLE "customer_address" ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable products price columns (text -> decimal)
ALTER TABLE "products" ALTER COLUMN "price" TYPE DECIMAL(10,2) USING ("price"::DECIMAL(10,2));
ALTER TABLE "products" ALTER COLUMN "offer_price" TYPE DECIMAL(10,2) USING (
  CASE
    WHEN "offer_price" IS NULL OR TRIM("offer_price") = '' THEN NULL
    ELSE "offer_price"::DECIMAL(10,2)
  END
);

-- CreateTable orders
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_no" TEXT NOT NULL,
    "customer_id" UUID,
    "address_id" UUID,
    "guest_name" TEXT,
    "guest_phone" TEXT,
    "guest_email" TEXT,
    "guest_address" TEXT,
    "guest_city" TEXT,
    "guest_pincode" TEXT,
    "payment_method" "PaymentMethod" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable order_items
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "size" TEXT,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "customer_address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
