-- AlterTable
-- 访问审批：新注册用户默认走申请流程（由应用层显式写 pending），
-- 已有数据用默认值 approved 填充，避免把现有用户（含管理员）锁在门外。
ALTER TABLE "users"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN "trusted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "note" TEXT;

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");
