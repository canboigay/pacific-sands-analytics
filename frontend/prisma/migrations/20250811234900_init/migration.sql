-- CreateTable
CREATE TABLE "PaceReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" DATETIME NOT NULL,
    "targetMonth" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayName" TEXT,
    "occupancy" REAL NOT NULL,
    "adr" REAL NOT NULL,
    "revenue" REAL NOT NULL,
    "roomsSold" INTEGER NOT NULL,
    "roomsAvailable" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OccupancyData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotDate" DATETIME NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dayOfWeek" TEXT,
    "roomType" TEXT DEFAULT 'All',
    "available" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL,
    "occupancyRate" REAL NOT NULL,
    "adr" REAL,
    "revPAR" REAL,
    "revenue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RateShop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" DATETIME NOT NULL,
    "checkInDate" DATETIME NOT NULL,
    "nights" INTEGER DEFAULT 1,
    "property" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "ourRate" REAL,
    "compRate" REAL,
    "difference" REAL,
    "percentDiff" REAL,
    "availability" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DataImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "recordCount" INTEGER NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errors" JSONB,
    "metadata" JSONB
);

-- CreateTable
CREATE TABLE "MonthlyMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" DATETIME NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "avgOccupancy" REAL NOT NULL,
    "avgAdr" REAL NOT NULL,
    "totalRevenue" REAL NOT NULL,
    "totalRoomsSold" INTEGER NOT NULL,
    "totalAvailable" INTEGER NOT NULL,
    "revPAR" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "PaceReport_reportDate_targetMonth_idx" ON "PaceReport"("reportDate", "targetMonth");

-- CreateIndex
CREATE INDEX "PaceReport_roomType_idx" ON "PaceReport"("roomType");

-- CreateIndex
CREATE INDEX "OccupancyData_date_idx" ON "OccupancyData"("date");

-- CreateIndex
CREATE INDEX "OccupancyData_fiscalYear_idx" ON "OccupancyData"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "OccupancyData_snapshotDate_date_roomType_key" ON "OccupancyData"("snapshotDate", "date", "roomType");

-- CreateIndex
CREATE INDEX "RateShop_reportDate_checkInDate_idx" ON "RateShop"("reportDate", "checkInDate");

-- CreateIndex
CREATE INDEX "RateShop_property_idx" ON "RateShop"("property");

-- CreateIndex
CREATE INDEX "DataImport_fileType_status_idx" ON "DataImport"("fileType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyMetrics_month_fiscalYear_key" ON "MonthlyMetrics"("month", "fiscalYear");
