-- AlterTable
ALTER TABLE "attachments" ADD COLUMN "homeworkSubmissionId" TEXT;
ALTER TABLE "attachments" ADD COLUMN "assignmentSubmissionId" TEXT;

-- CreateIndex
CREATE INDEX "attachments_homeworkSubmissionId_idx" ON "attachments"("homeworkSubmissionId");

-- CreateIndex
CREATE INDEX "attachments_assignmentSubmissionId_idx" ON "attachments"("assignmentSubmissionId");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_homeworkSubmissionId_fkey" FOREIGN KEY ("homeworkSubmissionId") REFERENCES "homework_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_assignmentSubmissionId_fkey" FOREIGN KEY ("assignmentSubmissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
