-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'BKASH';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'NAGAD';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ROCKET';

-- AlterTable
ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "payment_sender_number" TEXT,
ADD COLUMN IF NOT EXISTS "payment_transaction_id" TEXT;
