-- CreateTable
CREATE TABLE "Revision" (
    "subjectId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "syncedAt" DATETIME NOT NULL,

    PRIMARY KEY ("subjectId", "count")
);

-- CreateTable
CREATE TABLE "Read" (
    "subjectId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "clientUpdatedAt" DATETIME NOT NULL,
    "revisionCount" INTEGER NOT NULL,

    PRIMARY KEY ("subjectId", "bookId"),
    CONSTRAINT "Read_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Read_subjectId_revisionCount_fkey" FOREIGN KEY ("subjectId", "revisionCount") REFERENCES "Revision" ("subjectId", "count") ON DELETE CASCADE ON UPDATE CASCADE
);
