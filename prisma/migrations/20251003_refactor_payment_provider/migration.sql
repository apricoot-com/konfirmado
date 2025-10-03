-- Refactor to provider-agnostic payment structure

-- Step 1: Add new JSON columns
ALTER TABLE "Tenant" ADD COLUMN "paymentProvider" TEXT DEFAULT 'wompi';
ALTER TABLE "Tenant" ADD COLUMN "paymentConfig" JSONB;
ALTER TABLE "Tenant" ADD COLUMN "paymentMethodInfo" JSONB;

-- Step 2: Migrate existing Wompi data to JSON structure
UPDATE "Tenant" 
SET "paymentConfig" = jsonb_build_object(
  'provider', 'wompi',
  'publicKey', "wompiPublicKey",
  'privateKey', "wompiPrivateKey",
  'integritySecret', "wompiIntegritySecret",
  'eventsSecret', "wompiEventsSecret",
  'mode', "wompiMode"
)
WHERE "wompiPublicKey" IS NOT NULL;

UPDATE "Tenant"
SET "paymentMethodInfo" = jsonb_build_object(
  'provider', 'wompi',
  'token', "paymentMethodToken",
  'type', "paymentMethodType",
  'mask', "paymentMethodMask"
)
WHERE "paymentMethodToken" IS NOT NULL;

-- Step 3: Update Subscription table
ALTER TABLE "Subscription" ADD COLUMN "paymentInfo" JSONB;

UPDATE "Subscription"
SET "paymentInfo" = jsonb_build_object(
  'provider', 'wompi',
  'reference', "paymentReference",
  'status', "paymentStatus"
)
WHERE "paymentReference" IS NOT NULL;

-- Step 4: Drop old Wompi-specific columns
ALTER TABLE "Tenant" DROP COLUMN "wompiPublicKey";
ALTER TABLE "Tenant" DROP COLUMN "wompiPrivateKey";
ALTER TABLE "Tenant" DROP COLUMN "wompiIntegritySecret";
ALTER TABLE "Tenant" DROP COLUMN "wompiEventsSecret";
ALTER TABLE "Tenant" DROP COLUMN "wompiMode";
ALTER TABLE "Tenant" DROP COLUMN "paymentMethodToken";
ALTER TABLE "Tenant" DROP COLUMN "paymentMethodType";
ALTER TABLE "Tenant" DROP COLUMN "paymentMethodMask";

ALTER TABLE "Subscription" DROP COLUMN "paymentReference";
ALTER TABLE "Subscription" DROP COLUMN "paymentStatus";
