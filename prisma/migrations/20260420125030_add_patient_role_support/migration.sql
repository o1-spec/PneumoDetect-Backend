/*
  Warnings:

  - The values [PNEUMONIA] on the enum `Result` will be removed. If these variants are still used in the database, this will fail.
  - The values [UPLOADED] on the enum `ScanStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `doctorId` on the `Scan` table. All the data in the column will be lost.
  - Added the required column `clinicianId` to the `Scan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'OTHER';

-- AlterEnum
BEGIN;
CREATE TYPE "Result_new" AS ENUM ('PNEUMONIA_DETECTED', 'NORMAL', 'CONCERNS');
ALTER TABLE "Scan" ALTER COLUMN "result" TYPE "Result_new" USING ("result"::text::"Result_new");
ALTER TYPE "Result" RENAME TO "Result_old";
ALTER TYPE "Result_new" RENAME TO "Result";
DROP TYPE "Result_old";
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PATIENT';

-- AlterEnum
BEGIN;
CREATE TYPE "ScanStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
ALTER TABLE "Scan" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Scan" ALTER COLUMN "status" TYPE "ScanStatus_new" USING ("status"::text::"ScanStatus_new");
ALTER TYPE "ScanStatus" RENAME TO "ScanStatus_old";
ALTER TYPE "ScanStatus_new" RENAME TO "ScanStatus";
DROP TYPE "ScanStatus_old";
ALTER TABLE "Scan" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Scan" DROP CONSTRAINT "Scan_doctorId_fkey";

-- AlterTable
ALTER TABLE "Scan" DROP COLUMN "doctorId",
ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "clinicianId" TEXT NOT NULL,
ADD COLUMN     "clinicianNotes" TEXT,
ADD COLUMN     "isSharedWithPatient" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "patientNotes" TEXT,
ADD COLUMN     "patientViewedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "bloodType" TEXT,
    "medicalHistory" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

-- CreateIndex
CREATE INDEX "PatientProfile_userId_idx" ON "PatientProfile"("userId");

-- CreateIndex
CREATE INDEX "Scan_patientId_createdAt_idx" ON "Scan"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_clinicianId_idx" ON "Scan"("clinicianId");

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
