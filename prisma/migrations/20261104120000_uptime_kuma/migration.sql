-- CreateTable
CREATE TABLE "UptimeKumaConfig" (
    "userId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UptimeKumaConfig_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UptimeKumaConfig" ADD CONSTRAINT "UptimeKumaConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
