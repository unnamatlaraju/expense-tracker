-- CreateEnum
CREATE TYPE "CommitmentKind" AS ENUM ('bill', 'emi', 'subscription', 'other');

-- AlterTable
ALTER TABLE "RecurringExpense" ADD COLUMN     "autopay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "kind" "CommitmentKind" NOT NULL DEFAULT 'other',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "remindDaysBefore" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "remindersEnabled" BOOLEAN NOT NULL DEFAULT true;
