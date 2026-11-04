-- CreateTable
CREATE TABLE "NtfySubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serverUrl" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "token" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NtfySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NtfySubscription_userId_serverUrl_topic_key" ON "NtfySubscription"("userId", "serverUrl", "topic");

-- AddForeignKey
ALTER TABLE "NtfySubscription" ADD CONSTRAINT "NtfySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
