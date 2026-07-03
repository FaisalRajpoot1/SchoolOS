-- CreateTable
CREATE TABLE "grade_bands" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minPercentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "grade_bands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grade_bands_schoolId_idx" ON "grade_bands"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "grade_bands_schoolId_label_key" ON "grade_bands"("schoolId", "label");

-- AddForeignKey
ALTER TABLE "grade_bands" ADD CONSTRAINT "grade_bands_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
