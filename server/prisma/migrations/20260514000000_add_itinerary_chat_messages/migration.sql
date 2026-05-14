CREATE TABLE "ItineraryChatMessage" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ItineraryChatMessage_itineraryId_sequence_idx" ON "ItineraryChatMessage"("itineraryId", "sequence");

ALTER TABLE "ItineraryChatMessage" ADD CONSTRAINT "ItineraryChatMessage_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
