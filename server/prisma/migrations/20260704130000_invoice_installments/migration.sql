-- CreateTable
CREATE TABLE "invoice_installments" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "label" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "invoice_installments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_installments_invoiceId_idx" ON "invoice_installments"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_installments_schoolId_idx" ON "invoice_installments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_installments_invoiceId_seq_key" ON "invoice_installments"("invoiceId", "seq");

-- AddForeignKey
ALTER TABLE "invoice_installments" ADD CONSTRAINT "invoice_installments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_installments" ADD CONSTRAINT "invoice_installments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
