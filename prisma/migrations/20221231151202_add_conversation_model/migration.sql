-- CreateTable
CREATE TABLE "chatgpt_conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "chatgpt_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatgpt_conversation_conversationId_key" ON "chatgpt_conversation"("conversationId");
