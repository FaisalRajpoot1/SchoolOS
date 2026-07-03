-- CreateEnum
CREATE TYPE "BehaviorType" AS ENUM ('MERIT', 'DEMERIT', 'INCIDENT');

-- CreateTable
CREATE TABLE "behavior_records" (
    "id" TEXT NOT NULL,
    "type" "BehaviorType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "occurredOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "recordedById" TEXT,

    CONSTRAINT "behavior_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "behavior_records_schoolId_idx" ON "behavior_records"("schoolId");

-- CreateIndex
CREATE INDEX "behavior_records_studentId_idx" ON "behavior_records"("studentId");

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
