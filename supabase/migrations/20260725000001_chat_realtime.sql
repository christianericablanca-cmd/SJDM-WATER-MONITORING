-- Enable Supabase Realtime for chat_messages

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  -- Recommended so UPDATE/DELETE events include full row data.
  BEGIN
    EXECUTE 'ALTER TABLE public.chat_messages REPLICA IDENTITY FULL';
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;
END
$$;
