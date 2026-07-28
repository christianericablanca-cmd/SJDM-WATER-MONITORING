-- Backfill disabled = false for businesses where it's NULL
-- These were created before the disabled column existed or via claim approval
-- that didn't set the field, causing them to be filtered out by .eq("disabled", false) queries.
UPDATE businesses SET disabled = false WHERE disabled IS NULL;
