/*
  Warnings:

  - You are about to drop the column `groupId` on the `Conversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[conversationId]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `conversationId` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AIActionType" ADD VALUE 'CREATE_GROUP_CHAT';
ALTER TYPE "AIActionType" ADD VALUE 'SEND_MESSAGE';
ALTER TYPE "AIActionType" ADD VALUE 'CREATE_CONVERSATION';

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_groupId_fkey";

-- DropIndex
DROP INDEX "Conversation_groupId_key";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "groupId",
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "conversationId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Group_conversationId_key" ON "Group"("conversationId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
