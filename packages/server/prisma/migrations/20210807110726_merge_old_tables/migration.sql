PRAGMA foreign_keys=OFF;

-- Create table (Made by IDEA)
CREATE TABLE IF NOT EXISTS bookInfos (
    id UUID not null primary key,
    name VARCHAR(255) not null unique,
    thumbnail UUIDV4,
    count INTEGER default 0 not null,
    history TINYINT(1) default 0 not null,
    createdAt DATETIME not null,
    updatedAt DATETIME not null
);

CREATE TABLE IF NOT EXISTS books (
    id UUID not null primary key,
    thumbnail INTEGER,
    number VARCHAR(255) not null,
    pages INTEGER not null,
    infoId UUID not null,
    createdAt DATETIME not null,
    updatedAt DATETIME not null,
    unique (number, infoId)
);

CREATE TABLE IF NOT EXISTS genres (
    id INTEGER primary key autoincrement,
    name VARCHAR(255) not null unique,
    invisible TINYINT(1) default 0 not null
);

CREATE TABLE IF NOT EXISTS infoGenres (
    id INTEGER primary key autoincrement,
    infoId UUID not null,
    genreId INTEGER not null,
    unique (infoId, genreId)
);

-- Move data
INSERT OR IGNORE INTO Genre (name, isInvisible) SELECT name, invisible FROM genres;

INSERT INTO BookInfo (id, name, historyBookCount, createdAt, updatedAt)
    SELECT
        id,
        name,
        case when history then count end,
        strftime('%Y-%m-%dT%H:%M:%fZ', createdAt),
        (strftime('%s', updatedAt) - strftime('%S', updatedAt) + strftime('%f', updatedAt)) * 1000 -- unix epoch
    FROM bookInfos;

INSERT INTO Book (id, infoId, thumbnailPage, number, pageCount, thumbnailById, createdAt, updatedAt)
    SELECT b.id,
        infoId,
        b.thumbnail,
        number,
        pages,
        bI.id,
        strftime('%Y-%m-%dT%H:%M:%fZ', b.createdAt),
        (strftime('%s', b.updatedAt) - strftime('%S', b.updatedAt) + strftime('%f', b.updatedAt)) * 1000 -- unix epoch
    FROM books as b LEFT JOIN bookInfos bI on bI.thumbnail = b.id;

INSERT INTO BookInfosToGenres (infoId, genreName)
    SELECT infoId, g.name FROM infoGenres
        JOIN genres g on g.id = infoGenres.genreId;

-- Drop table
DROP TABLE IF EXISTS SequelizeMeta;
DROP TABLE IF EXISTS bookInfos;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS infoGenres;

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
