DROP INDEX "embeddingIndex";--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "embedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "embedding" SET NOT NULL;