/*
  Warnings:

  - You are about to drop the column `conversationId` on the `chatgpt_conversation` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `chatgpt_conversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[conversation_id]` on the table `chatgpt_conversation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,tenant_id]` on the table `chatgpt_conversation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `conversation_id` to the `chatgpt_conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message_id` to the `chatgpt_conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `chatgpt_conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `chatgpt_conversation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "chatgpt_conversation_conversationId_key";

-- AlterTable
ALTER TABLE "chatgpt_conversation" DROP COLUMN "conversationId",
DROP COLUMN "messageId",
ADD COLUMN     "conversation_id" TEXT NOT NULL,
ADD COLUMN     "message_id" TEXT NOT NULL,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "query_risk_user" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "query" TEXT NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "query_risk_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "query_risk_user_date_user_id_language_idx" ON "query_risk_user"("date", "user_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "chatgpt_conversation_conversation_id_key" ON "chatgpt_conversation"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "chatgpt_conversation_user_id_tenant_id_key" ON "chatgpt_conversation"("user_id", "tenant_id");
