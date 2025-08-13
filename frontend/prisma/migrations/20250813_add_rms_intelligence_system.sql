-- CreateTable
CREATE TABLE "RMSFormula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "formulaExpression" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "RMSFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RMSFormulaVersion" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "formulaExpression" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RMSFormulaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RMSRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "RMSRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RMSParameter" (
    "id" TEXT NOT NULL,
    "parameterKey" TEXT NOT NULL,
    "parameterValue" JSONB NOT NULL,
    "parameterType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "defaultValue" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "RMSParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RMSCalculation" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "inputValues" JSONB NOT NULL,
    "outputValue" JSONB NOT NULL,
    "executionTime" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "RMSCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RMSRuleExecution" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "conditionMet" BOOLEAN NOT NULL,
    "actionsTaken" JSONB,
    "executionTime" DOUBLE PRECISION NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "RMSRuleExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RMSFormulaTest" (
    "id" TEXT NOT NULL,
    "formulaName" TEXT NOT NULL,
    "testData" JSONB NOT NULL,
    "expectedResult" JSONB NOT NULL,
    "actualResult" JSONB,
    "passed" BOOLEAN,
    "errorMessage" TEXT,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testedBy" TEXT,

    CONSTRAINT "RMSFormulaTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RMSFormula_name_key" ON "RMSFormula"("name");

-- CreateIndex
CREATE INDEX "RMSFormula_category_idx" ON "RMSFormula"("category");

-- CreateIndex
CREATE INDEX "RMSFormula_isActive_idx" ON "RMSFormula"("isActive");

-- CreateIndex
CREATE INDEX "RMSFormulaVersion_formulaId_idx" ON "RMSFormulaVersion"("formulaId");

-- CreateIndex
CREATE UNIQUE INDEX "RMSFormulaVersion_formulaId_version_key" ON "RMSFormulaVersion"("formulaId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RMSRule_name_key" ON "RMSRule"("name");

-- CreateIndex
CREATE INDEX "RMSRule_ruleType_idx" ON "RMSRule"("ruleType");

-- CreateIndex
CREATE INDEX "RMSRule_isActive_idx" ON "RMSRule"("isActive");

-- CreateIndex
CREATE INDEX "RMSRule_priority_idx" ON "RMSRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "RMSParameter_parameterKey_key" ON "RMSParameter"("parameterKey");

-- CreateIndex
CREATE INDEX "RMSParameter_category_idx" ON "RMSParameter"("category");

-- CreateIndex
CREATE INDEX "RMSParameter_parameterKey_idx" ON "RMSParameter"("parameterKey");

-- CreateIndex
CREATE INDEX "RMSCalculation_formulaId_idx" ON "RMSCalculation"("formulaId");

-- CreateIndex
CREATE INDEX "RMSCalculation_calculatedAt_idx" ON "RMSCalculation"("calculatedAt");

-- CreateIndex
CREATE INDEX "RMSRuleExecution_ruleId_idx" ON "RMSRuleExecution"("ruleId");

-- CreateIndex
CREATE INDEX "RMSRuleExecution_executedAt_idx" ON "RMSRuleExecution"("executedAt");

-- CreateIndex
CREATE INDEX "RMSFormulaTest_formulaName_idx" ON "RMSFormulaTest"("formulaName");

-- CreateIndex
CREATE INDEX "RMSFormulaTest_testedAt_idx" ON "RMSFormulaTest"("testedAt");

-- AddForeignKey
ALTER TABLE "RMSFormulaVersion" ADD CONSTRAINT "RMSFormulaVersion_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "RMSFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RMSCalculation" ADD CONSTRAINT "RMSCalculation_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "RMSFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RMSRuleExecution" ADD CONSTRAINT "RMSRuleExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RMSRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;