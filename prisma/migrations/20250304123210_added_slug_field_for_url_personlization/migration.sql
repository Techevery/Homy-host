-- Step 1: Add the slug column with a default value
ALTER TABLE "agents" ADD COLUMN "slug" TEXT NOT NULL DEFAULT 'temp-slug';

-- Step 2: Update existing rows with unique slugs
-- Use a combination of the agent's ID and name to generate a unique slug
UPDATE "agents" SET "slug" = CONCAT('agent-', "id");

-- Step 3: Remove the default value (optional)
ALTER TABLE "agents" ALTER COLUMN "slug" DROP DEFAULT;

-- Step 4: Add the unique constraint
CREATE UNIQUE INDEX "agents_slug_key" ON "agents"("slug");