/*
  Warnings:

  - The values [PNEUMONIA_DETECTED] on the enum `Result` will be removed. If these variants are still used in the database, this will fail.

  This migration safely renames PNEUMONIA_DETECTED to PNEUMONIA.
*/
-- Create new enum
CREATE TYPE "Result_new" AS ENUM ('PNEUMONIA', 'NORMAL', 'CONCERNS');

-- Migrate data with cast
ALTER TABLE "Scan" ALTER COLUMN "result" TYPE "Result_new" USING (
  CASE 
    WHEN "result"::text = 'PNEUMONIA_DETECTED' THEN 'PNEUMONIA'::"Result_new"
    WHEN "result"::text = 'NORMAL' THEN 'NORMAL'::"Result_new"
    WHEN "result"::text = 'CONCERNS' THEN 'CONCERNS'::"Result_new"
    ELSE NULL
  END
);

-- Drop old enum
DROP TYPE "Result";

-- Rename new enum
ALTER TYPE "Result_new" RENAME TO "Result";
