-- AlterTable
ALTER TABLE "upload_metadata" DROP COLUMN "data_type",
ADD COLUMN     "data_type_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "data_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "data_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_definitions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "data_type_id" INTEGER NOT NULL,

    CONSTRAINT "field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_types_name_key" ON "data_types"("name");

-- AddForeignKey
ALTER TABLE "upload_metadata" ADD CONSTRAINT "upload_metadata_data_type_id_fkey" FOREIGN KEY ("data_type_id") REFERENCES "data_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_definitions" ADD CONSTRAINT "field_definitions_data_type_id_fkey" FOREIGN KEY ("data_type_id") REFERENCES "data_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

