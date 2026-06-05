-- Prevent duplicate purchases/ownership grants for the same user and track.
CREATE UNIQUE INDEX "TrackOwner_trackId_userId_key" ON "TrackOwner"("trackId", "userId");
