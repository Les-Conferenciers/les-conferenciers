-- 1. Permettre DELETE sur simulator_leads pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete leads"
ON public.simulator_leads
FOR DELETE
TO authenticated
USING (true);

-- 4. Stocker l'intervenant sélectionné directement sur le contrat
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS selected_speaker_id uuid;