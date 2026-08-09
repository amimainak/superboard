-- CreateTable: WebhookConfig
-- Stores user webhook endpoint configurations for event notifications.

CREATE TABLE "WebhookConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: WebhookConfig_userId_idx
CREATE INDEX "WebhookConfig_userId_idx" ON "WebhookConfig"("userId");

-- AddForeignKey: WebhookConfig_userId_fkey
ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
