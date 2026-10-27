-- CreateEnum
CREATE TYPE "employee_event_type" AS ENUM ('UPDATED', 'TERMINATED', 'REINSTATED');

-- CreateTable
CREATE TABLE "employee_events" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "type" "employee_event_type" NOT NULL,
    "changes" JSONB,
    "reason" TEXT,
    "changed_by_id" INTEGER,
    "changed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_events_employee_id_changed_at_idx" ON "employee_events"("employee_id", "changed_at");

-- AddForeignKey
ALTER TABLE "employee_events" ADD CONSTRAINT "employee_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_events" ADD CONSTRAINT "employee_events_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
