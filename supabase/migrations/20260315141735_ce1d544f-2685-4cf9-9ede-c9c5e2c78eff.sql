ALTER TABLE public.events
  ADD COLUMN event_title text,
  ADD COLUMN contact_on_site_name text,
  ADD COLUMN contact_on_site_phone text,
  ADD COLUMN contact_on_site_email text,
  ADD COLUMN tech_needs text,
  ADD COLUMN room_setup text,
  ADD COLUMN arrival_info text,
  ADD COLUMN dress_code text,
  ADD COLUMN special_requests text,
  ADD COLUMN conference_title text,
  ADD COLUMN conference_duration text,
  ADD COLUMN parking_info text,
  ADD COLUMN hotel_info text;