-- AlterTable
ALTER TABLE "User" ADD COLUMN     "widgetLayout" JSONB;

-- Carry saved orders over as one widget per column, which is how they rendered before.
UPDATE "User"
SET "widgetLayout" = (
    SELECT jsonb_agg(jsonb_build_array("widget"."id") ORDER BY "widget"."position")
    FROM unnest("widgetOrder") WITH ORDINALITY AS "widget"("id", "position")
)
WHERE cardinality("widgetOrder") > 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "widgetOrder";
