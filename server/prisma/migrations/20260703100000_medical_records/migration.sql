-- CreateEnum
CREATE TYPE "VisitOutcome" AS ENUM ('RESOLVED', 'SENT_HOME', 'REFERRED', 'MONITORING');

-- CreateTable
CREATE TABLE "medical_profiles" (
    "id" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "allergies" TEXT,
    "conditions" TEXT,
    "medications" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "medical_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infirmary_visits" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "treatment" TEXT,
    "temperatureC" DOUBLE PRECISION,
    "outcome" "VisitOutcome" NOT NULL DEFAULT 'RESOLVED',
    "visitedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "recordedById" TEXT,

    CONSTRAINT "infirmary_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medical_profiles_studentId_key" ON "medical_profiles"("studentId");

-- CreateIndex
CREATE INDEX "medical_profiles_schoolId_idx" ON "medical_profiles"("schoolId");

-- CreateIndex
CREATE INDEX "infirmary_visits_schoolId_idx" ON "infirmary_visits"("schoolId");

-- CreateIndex
CREATE INDEX "infirmary_visits_studentId_idx" ON "infirmary_visits"("studentId");

-- AddForeignKey
ALTER TABLE "medical_profiles" ADD CONSTRAINT "medical_profiles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_profiles" ADD CONSTRAINT "medical_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infirmary_visits" ADD CONSTRAINT "infirmary_visits_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infirmary_visits" ADD CONSTRAINT "infirmary_visits_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infirmary_visits" ADD CONSTRAINT "infirmary_visits_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
