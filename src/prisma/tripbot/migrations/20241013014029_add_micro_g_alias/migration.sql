/*
  Warnings:

  - The values [µG] on the enum `drug_mass_unit` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "drug_mass_unit_new" AS ENUM ('MG', 'ML', 'uG', 'G', 'OZ', 'FLOZ');
ALTER TABLE "user_drug_doses" ALTER COLUMN "units" TYPE "drug_mass_unit_new" USING ("units"::text::"drug_mass_unit_new");
ALTER TYPE "drug_mass_unit" RENAME TO "drug_mass_unit_old";
ALTER TYPE "drug_mass_unit_new" RENAME TO "drug_mass_unit";
DROP TYPE "drug_mass_unit_old";
COMMIT;
