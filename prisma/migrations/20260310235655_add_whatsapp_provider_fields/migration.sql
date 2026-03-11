-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "evolutionApiUrl" TEXT NOT NULL DEFAULT 'https://api.autonexus.app',
    "evolutionInstanceName" TEXT NOT NULL DEFAULT 'Informação - Clientes',
    "evolutionToken" TEXT NOT NULL DEFAULT '',
    "whatsappProvider" TEXT NOT NULL DEFAULT 'EVOLUTION',
    "whatsappApiUrl" TEXT NOT NULL DEFAULT 'https://api.autonexus.app',
    "whatsappToken" TEXT NOT NULL DEFAULT '',
    "whatsappInstanceName" TEXT NOT NULL DEFAULT 'Informação - Clientes',
    "whatsappGroupId" TEXT NOT NULL DEFAULT '',
    "openaiApiKey" TEXT NOT NULL DEFAULT '',
    "systemPrompt" TEXT,
    "defaultPromptId" TEXT,
    "autoReportTime" TEXT NOT NULL DEFAULT '08:00',
    "isAutoReportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReportPeriod" TEXT NOT NULL DEFAULT 'YESTERDAY',
    "langchainModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "langchainTemperature" REAL NOT NULL DEFAULT 0.7,
    "schedulerHeartbeat" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "includeInAutoReport" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sendToJid" TEXT,
    "sendToName" TEXT,
    "promptId" TEXT,
    CONSTRAINT "Group_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jid" TEXT NOT NULL,
    "name" TEXT,
    "pushName" TEXT,
    "profilePictureUrl" TEXT,
    "email" TEXT,
    "description" TEXT,
    "website" TEXT,
    "isBusiness" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRef" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "occurrences" TEXT NOT NULL,
    "problems" TEXT NOT NULL,
    "orders" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "engagement" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "processedData" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "groupId" TEXT,
    CONSTRAINT "Report_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "successCount" INTEGER NOT NULL,
    "failCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "roleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "_ContactToGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContactToGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContactToGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_jid_key" ON "Contact"("jid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");

-- CreateIndex
CREATE UNIQUE INDEX "_ContactToGroup_AB_unique" ON "_ContactToGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_ContactToGroup_B_index" ON "_ContactToGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");
