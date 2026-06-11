-- Add covering indexes for foreign keys used by auth, catalogue, ordering, and webhook flows.
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "TrackOwner_userId_idx" ON "TrackOwner"("userId");
CREATE INDEX "Comment_trackId_idx" ON "Comment"("trackId");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "OrderItem_trackId_idx" ON "OrderItem"("trackId");
CREATE INDEX "PaymentEvent_orderId_idx" ON "PaymentEvent"("orderId");
