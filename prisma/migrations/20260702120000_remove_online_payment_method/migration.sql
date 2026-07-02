-- Migrate existing ONLINE orders to COD
UPDATE "orders" SET "payment_method" = 'COD' WHERE "payment_method" = 'ONLINE';

-- Replace enum (PostgreSQL cannot drop enum values directly)
CREATE TYPE "PaymentMethod_new" AS ENUM ('COD', 'BKASH', 'NAGAD', 'ROCKET');

ALTER TABLE "orders"
  ALTER COLUMN "payment_method" TYPE "PaymentMethod_new"
  USING ("payment_method"::text::"PaymentMethod_new");

DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
