-- Ticket descriptions held what the user had taken and their issue; that stays in the Discord thread only.
ALTER TABLE "user_tickets" DROP COLUMN "description";

-- Command parameters are now recorded by name, with values only for these options and booleans.
-- Remove previously stored values (user IDs, free text) that no longer qualify.
DELETE FROM "command_usage_parameter"
WHERE "name" NOT IN ('substance', 'section', 'first_drug', 'second_drug')
  AND "value" NOT IN ('true', 'false');

-- Roles are only needed while a ticket is open, to restore them afterwards.
UPDATE "users" SET "roles" = NULL
WHERE "roles" IS NOT NULL
  AND "id" NOT IN (
    SELECT "user_id" FROM "user_tickets" WHERE "status" NOT IN ('CLOSED', 'RESOLVED', 'DELETED')
  );
