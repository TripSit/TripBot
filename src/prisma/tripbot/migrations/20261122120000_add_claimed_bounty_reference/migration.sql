-- A bounty claim can carry a reference ("<pull request>#<issue>"); a unique index stops the same bounty being paid twice.
ALTER TABLE "claimed_bounties" ADD COLUMN "reference" TEXT;
CREATE UNIQUE INDEX "claimed_bounties_reference_key" ON "claimed_bounties"("reference");
