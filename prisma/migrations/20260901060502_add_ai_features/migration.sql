-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferences" TEXT;
