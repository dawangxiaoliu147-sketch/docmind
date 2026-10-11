-- 职位库：从"内置示例"升级为"可溯源的真实职位"
-- 全部是追加式改动（ADD COLUMN / CREATE INDEX），对现有数据与旧代码都安全：
-- 旧代码不读这些新列也能正常跑，新代码读到的旧行 source='manual'、active=true。

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "apply_channel" TEXT,
ADD COLUMN     "apply_email" TEXT,
ADD COLUMN     "apply_url" TEXT,
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "posted_at" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "source_id" TEXT,
ADD COLUMN     "url" TEXT;

-- CreateIndex
CREATE INDEX "jobs_source_idx" ON "jobs"("source");

-- CreateIndex
CREATE INDEX "jobs_posted_at_idx" ON "jobs"("posted_at");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_source_source_id_key" ON "jobs"("source", "source_id");
