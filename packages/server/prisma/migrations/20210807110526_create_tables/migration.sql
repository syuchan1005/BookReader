-- CreateTable
CREATE TABLE "BookInfo" (
                            "id" TEXT NOT NULL PRIMARY KEY,
                            "name" TEXT NOT NULL,
                            "bookCount" INTEGER NOT NULL DEFAULT 0,
                            "isHistory" BOOLEAN NOT NULL DEFAULT false,
                            "createdAt" DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                            "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Book" (
                        "id" TEXT NOT NULL PRIMARY KEY,
                        "infoId" TEXT NOT NULL,
                        "thumbnailPage" INTEGER,
                        "number" TEXT NOT NULL,
                        "pageCount" INTEGER NOT NULL,
                        "thumbnailById" TEXT,
                        "createdAt" DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                        "updatedAt" DATETIME NOT NULL,
                        FOREIGN KEY ("infoId") REFERENCES "BookInfo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                        FOREIGN KEY ("thumbnailById") REFERENCES "BookInfo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Genre" (
                         "name" TEXT NOT NULL PRIMARY KEY,
                         "isInvisible" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "BookInfosToGenres" (
                                     "infoId" TEXT NOT NULL,
                                     "genreName" TEXT NOT NULL,

                                     PRIMARY KEY ("infoId", "genreName"),
                                     FOREIGN KEY ("infoId") REFERENCES "BookInfo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                                     FOREIGN KEY ("genreName") REFERENCES "Genre" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BookInfo_name_unique" ON "BookInfo"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Book_infoId_number_unique" ON "Book"("infoId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Book_thumbnailById_unique" ON "Book"("thumbnailById");

-- Seeding (It's a workaround for windows problem in seed feature)
INSERT INTO Genre (name, isInvisible) VALUES ('Invisible', true);
INSERT INTO Genre (name, isInvisible) VALUES ('Completed', false);
