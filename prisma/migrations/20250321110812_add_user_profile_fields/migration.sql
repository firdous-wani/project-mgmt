-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifications" JSONB DEFAULT '{"email": true, "push": true}',
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC';
