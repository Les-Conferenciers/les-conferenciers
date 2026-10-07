CREATE TABLE public.drive_folder_settings (
  month TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL,
  folder_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drive_folder_settings TO authenticated;
GRANT ALL ON public.drive_folder_settings TO service_role;

ALTER TABLE public.drive_folder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage drive folder settings"
ON public.drive_folder_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);