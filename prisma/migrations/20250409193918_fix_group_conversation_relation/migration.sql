/*
  Warnings:

  - A unique constraint covering the columns `[groupId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "Group" ALTER COLUMN "conversationId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_groupId_key" ON "Conversation"("groupId");
