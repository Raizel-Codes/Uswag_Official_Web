-- Earlier builds recorded a VALID row for every scan, so a member scanned twice counted twice.
-- Keep each member's first VALID row per event; relabel the later ones as repeats (nothing is deleted).
UPDATE "AttendanceRecord" a
SET "result" = 'DUPLICATE', "reason" = COALESCE(a."reason", 'Already checked in')
WHERE a."result" = 'VALID'
  AND a."memberId" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "AttendanceRecord" b
    WHERE b."eventId" = a."eventId" AND b."memberId" = a."memberId" AND b."result" = 'VALID'
      AND (b."scannedAt", b."id") < (a."scannedAt", a."id")
  );

-- At most one VALID check-in per member per event, enforced by the database so two officers
-- scanning the same card at the same moment can't both count. (Partial index: not in schema.prisma.)
CREATE UNIQUE INDEX "AttendanceRecord_one_valid_per_event_member"
  ON "AttendanceRecord" ("eventId", "memberId")
  WHERE "result" = 'VALID' AND "memberId" IS NOT NULL;
