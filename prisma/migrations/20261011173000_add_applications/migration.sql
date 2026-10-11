-- 投递记录表：把"找工作"闭环（投了哪些 / 到哪一步 / 何时该跟进）
-- 新增表，对现有数据零影响。与 users / jobs 都建了真实外键（删除时级联），
-- 比 Conversation / Resume 那两个"只有 userId 列没外键"的老表更规范。
-- resume_id 故意不加外键：简历可替换，删简历不该连带删掉投递历史。

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "resume_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'other',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "applied_at" TIMESTAMP(3),
    "next_follow_up" TIMESTAMP(3),
    "timeline" TEXT NOT NULL DEFAULT '[]',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_user_id_status_idx" ON "applications"("user_id", "status");

-- CreateIndex
CREATE INDEX "applications_next_follow_up_idx" ON "applications"("next_follow_up");

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_job_id_key" ON "applications"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
