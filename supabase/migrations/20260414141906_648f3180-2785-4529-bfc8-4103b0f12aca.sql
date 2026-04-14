CREATE TABLE public.proposal_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL DEFAULT 'relance_1',
  due_date DATE NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage proposal_tasks"
ON public.proposal_tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);