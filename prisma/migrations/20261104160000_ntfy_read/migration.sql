-- AlterTable
ALTER TABLE "NtfySubscription" ADD COLUMN     "clearedBefore" INTEGER;

-- CreateTable
CREATE TABLE "NtfyReadMessage" (
    "subscriptionId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "messageTime" INTEGER NOT NULL,

    CONSTRAINT "NtfyReadMessage_pkey" PRIMARY KEY ("subscriptionId","messageId")
);

-- AddForeignKey
ALTER TABLE "NtfyReadMessage" ADD CONSTRAINT "NtfyReadMessage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "NtfySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
