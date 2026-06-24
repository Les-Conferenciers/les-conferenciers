UPDATE public.email_templates
SET available_variables = available_variables || '[
  {"key": "details", "label": "Détails événement", "example": "Conférence d''ouverture du séminaire annuel"},
  {"key": "format", "label": "Format", "example": "Conférence"},
  {"key": "frais_vhr", "label": "Frais VHR", "example": "1 200 € HT"}
]'::jsonb
WHERE key IN ('speaker_event_info', 'contract_to_speaker');