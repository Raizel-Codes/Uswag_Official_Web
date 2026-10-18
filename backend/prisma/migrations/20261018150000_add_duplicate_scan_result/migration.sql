-- A valid card scanned again for an event it already checked in to. Kept in its own migration:
-- Postgres won't let a value added to an enum be used in the same transaction.
ALTER TYPE "ScanResult" ADD VALUE 'DUPLICATE';
