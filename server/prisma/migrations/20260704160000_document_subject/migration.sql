-- AlterTable
ALTER TABLE "documents" ADD COLUMN "subjectId" TEXT;

-- CreateIndex
CREATE INDEX "documents_subjectId_idx" ON "documents"("subjectId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
