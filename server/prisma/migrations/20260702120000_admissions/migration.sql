-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('SUBMITTED', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'CONVERTED');

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" TEXT NOT NULL,
    "applicantFirstName" TEXT NOT NULL,
    "applicantLastName" TEXT NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "guardianEmail" TEXT,
    "desiredClass" TEXT,
    "message" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT,

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_studentId_key" ON "admission_applications"("studentId");

-- CreateIndex
CREATE INDEX "admission_applications_schoolId_idx" ON "admission_applications"("schoolId");

-- CreateIndex
CREATE INDEX "admission_applications_status_idx" ON "admission_applications"("status");

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
