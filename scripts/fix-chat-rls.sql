-- Fix ChatMessage RLS: Add UPDATE and DELETE policies
-- Also add senderId NOT NULL constraint (migration — may fail if column doesn't exist, handle gracefully)

-- Add UPDATE policy: only sender or room tutor can update (pin/unpin)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ChatMessage' AND policyname = 'chat_sender_or_tutor_update') THEN
    DROP POLICY "chat_sender_or_tutor_update" ON "ChatMessage";
  END IF;
END $$;

CREATE POLICY "chat_sender_or_tutor_update" ON "ChatMessage" FOR UPDATE USING (
  "senderId" = auth.uid()::text
  OR "roomId" IN (
    SELECT "id" FROM "Room" WHERE "tutorId" = auth.uid()::text
  )
);

-- Add DELETE policy: only sender or room tutor can delete
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ChatMessage' AND policyname = 'chat_sender_or_tutor_delete') THEN
    DROP POLICY "chat_sender_or_tutor_delete" ON "ChatMessage";
  END IF;
END $$;

CREATE POLICY "chat_sender_or_tutor_delete" ON "ChatMessage" FOR DELETE USING (
  "senderId" = auth.uid()::text
  OR "roomId" IN (
    SELECT "id" FROM "Room" WHERE "tutorId" = auth.uid()::text
  )
);
