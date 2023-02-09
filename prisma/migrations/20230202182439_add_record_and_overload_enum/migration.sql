-- AlterEnum
ALTER TYPE "ChatGPTState" ADD VALUE 'Overload';

-- CreateTable
CREATE TABLE "ChatGPTMessageResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,

    CONSTRAINT "ChatGPTMessageResult_pkey" PRIMARY KEY ("id")
);
