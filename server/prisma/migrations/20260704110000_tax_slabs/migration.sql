-- CreateTable
CREATE TABLE "tax_slabs" (
    "id" TEXT NOT NULL,
    "minMonthly" INTEGER NOT NULL,
    "rate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "tax_slabs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_slabs_schoolId_idx" ON "tax_slabs"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_slabs_schoolId_minMonthly_key" ON "tax_slabs"("schoolId", "minMonthly");

-- AddForeignKey
ALTER TABLE "tax_slabs" ADD CONSTRAINT "tax_slabs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
