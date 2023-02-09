/*
  Warnings:

  - You are about to drop the column `user_id` on the `chatgpt_conversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenant_id,session_id]` on the table `chatgpt_conversation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `session_id` to the `chatgpt_conversation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "chatgpt_conversation_user_id_tenant_id_key";

-- AlterTable
ALTER TABLE "chatgpt_conversation" DROP COLUMN "user_id",
ADD COLUMN     "session_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "chatgpt_conversation_tenant_id_session_id_key" ON "chatgpt_conversation"("tenant_id", "session_id");
