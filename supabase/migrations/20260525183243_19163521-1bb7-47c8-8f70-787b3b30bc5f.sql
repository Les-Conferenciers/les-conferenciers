ALTER TABLE public.events ADD COLUMN IF NOT EXISTS token TEXT;

UPDATE public.events SET token = encode(extensions.gen_random_bytes(32), 'hex') WHERE token IS NULL;

ALTER TABLE public.events ALTER COLUMN token SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN token SET DEFAULT encode(extensions.gen_random_bytes(32), 'hex');
CREATE UNIQUE INDEX IF NOT EXISTS events_token_key ON public.events(token);

DROP POLICY IF EXISTS "Public read events via token" ON public.events;
CREATE POLICY "Public read events via token" ON public.events
  FOR SELECT TO public
  USING (token IS NOT NULL);