/*
  Warnings:

  - You are about to drop the `Read` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Revision` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Read";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Revision";
PRAGMA foreign_keys=on;
