-- AlterTable
ALTER TABLE "documents" ADD COLUMN "teacherId" TEXT;

-- CreateIndex
CREATE INDEX "documents_teacherId_idx" ON "documents"("teacherId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
