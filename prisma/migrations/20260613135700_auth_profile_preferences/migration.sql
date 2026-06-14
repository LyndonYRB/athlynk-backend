/*
  Warnings:

  - The `availabilityPref` column on the `Preference` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `availability` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Preference" DROP COLUMN "availabilityPref",
ADD COLUMN     "availabilityPref" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "availability",
ADD COLUMN     "availability" TEXT[] DEFAULT ARRAY[]::TEXT[];
