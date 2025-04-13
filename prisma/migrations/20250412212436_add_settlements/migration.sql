/*
  Warnings:

  - The values [CREATE_EXPENSE,UPDATE_EXPENSE,DELETE_EXPENSE,CREATE_GROUP,ADD_USER_TO_GROUP,SUGGEST_SETTLEMENT,CREATE_GROUP_CHAT,SEND_MESSAGE,CREATE_CONVERSATION] on the enum `AIActionType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[settlementId]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "SettlementType" AS ENUM ('PAYMENT', 'RECEIPT');

-- AlterEnum
BEGIN;
CREATE TYPE "AIActionType_new" AS ENUM ('EXPENSE_CREATE', 'EXPENSE_UPDATE', 'GROUP_CREATE', 'PAYMENT_RECORD');
ALTER TABLE "AIAction" ALTER COLUMN "action" TYPE "AIActionType_new" USING ("action"::text::"AIActionType_new");
ALTER TYPE "AIActionType" RENAME TO "AIActionType_old";
ALTER TYPE "AIActionType_new" RENAME TO "AIActionType";
DROP TYPE "AIActionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "isSettlement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settlementId" TEXT;

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "settlementType" "SettlementType" NOT NULL DEFAULT 'PAYMENT',
    "initiatedById" TEXT NOT NULL,
    "settledWithUserId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Expense_settlementId_key" ON "Expense"("settlementId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_settledWithUserId_fkey" FOREIGN KEY ("settledWithUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
