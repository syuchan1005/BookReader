-- Drop old indexes
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "Session_token_key";

-- Rename tables
PRAGMA foreign_keys=off;

ALTER TABLE "User" RENAME TO "User_tmp";
ALTER TABLE "User_tmp" RENAME TO "user";

ALTER TABLE "Session" RENAME TO "Session_tmp";
ALTER TABLE "Session_tmp" RENAME TO "session";

ALTER TABLE "Account" RENAME TO "Account_tmp";
ALTER TABLE "Account_tmp" RENAME TO "account";

ALTER TABLE "Verification" RENAME TO "Verification_tmp";
ALTER TABLE "Verification_tmp" RENAME TO "verification";

PRAGMA foreign_keys=on;

-- Create indexes
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
