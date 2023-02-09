-- CreateEnum
CREATE TYPE "ChatGPTState" AS ENUM ('Running', 'Stopped', 'Error', 'Starting', 'Down');

-- CreateTable
CREATE TABLE "chatgpt_account" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isGoogleLogin" BOOLEAN NOT NULL DEFAULT false,
    "isMicrosoftLogin" BOOLEAN NOT NULL DEFAULT false,
    "status" "ChatGPTState" NOT NULL DEFAULT 'Down',

    CONSTRAINT "chatgpt_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatgpt_account_email_key" ON "chatgpt_account"("email");
