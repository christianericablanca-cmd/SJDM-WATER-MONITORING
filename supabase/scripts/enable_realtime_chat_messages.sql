DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table is already part of the publication.
      NULL;
    WHEN undefined_table THEN
      RAISE NOTICE 'Table public.chat_messages does not exist';
  END;

  -- Optional but recommended: ensures UPDATE/DELETE payloads include the full row.
  BEGIN
    EXECUTE 'ALTER TABLE public.chat_messages REPLICA IDENTITY FULL';
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;
END
$$;

SELECT pubname, schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename = 'chat_messages';
