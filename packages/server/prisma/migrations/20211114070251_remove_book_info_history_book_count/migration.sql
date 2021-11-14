/*
  Warnings:

  - You are about to drop the column `historyBookCount` on the `BookInfo` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "infoId" TEXT NOT NULL,
    "thumbnailPage" INTEGER,
    "number" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "thumbnailById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_infoId_fkey" FOREIGN KEY ("infoId") REFERENCES "BookInfo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Book_thumbnailById_fkey" FOREIGN KEY ("thumbnailById") REFERENCES "BookInfo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("createdAt", "id", "infoId", "number", "pageCount", "thumbnailById", "thumbnailPage", "updatedAt") SELECT "createdAt", "id", "infoId", "number", "pageCount", "thumbnailById", "thumbnailPage", "updatedAt" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE INDEX "Book_infoId_updatedAt_index" ON "Book"("infoId", "updatedAt");
CREATE UNIQUE INDEX "Book_infoId_number_key" ON "Book"("infoId", "number");
CREATE UNIQUE INDEX "Book_thumbnailById_key" ON "Book"("thumbnailById");
CREATE TABLE "new_BookInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BookInfo" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "BookInfo";
DROP TABLE "BookInfo";
ALTER TABLE "new_BookInfo" RENAME TO "BookInfo";
CREATE INDEX "BookInfo_createdAt_index" ON "BookInfo"("createdAt");
CREATE INDEX "BookInfo_updatedAt_index" ON "BookInfo"("updatedAt");
CREATE UNIQUE INDEX "BookInfo_name_key" ON "BookInfo"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
