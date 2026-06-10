DELETE FROM public.email_templates WHERE key = 'preparatory_call';

INSERT INTO public.email_templates (key, name, category, trigger_description, subject, body_html, default_subject, default_body_html, available_variables, is_active) VALUES
('preparatory_call_client',
 'Visio préparatoire - Client',
 'event',
 'Envoyé au client pour planifier la visio préparatoire avant la conférence.',
 'Visio préparatoire — Conférence du {{date_evenement}}',
 '<p>Bonjour {{prenom_destinataire}},</p>
<p>Afin de bien préparer l''intervention de <strong>{{conferencier}}</strong> pour votre événement du <strong>{{date_evenement}}</strong>, je vous propose d''organiser une visio préparatoire.</p>
<p>Voici les modalités :</p>
<ul>
<li>📅 Date : <strong>{{date_visio}}</strong></li>
<li>🕐 Heure : <strong>{{heure_visio}}</strong></li>
<li>🔗 Lien visio : <strong>{{lien_visio}}</strong></li>
</ul>
<p>Cette visio nous permettra de faire le point sur le déroulé de votre événement, les attentes et les questions logistiques.</p>
<p>Pourriez-vous me confirmer votre disponibilité ?</p>
<p>Dans l''attente de votre retour, je vous souhaite une excellente journée.</p>
<p>Nelly Sabde - Les Conférenciers</p>',
 'Visio préparatoire — Conférence du {{date_evenement}}',
 '',
 '["prenom_destinataire","conferencier","date_evenement","date_visio","heure_visio","lien_visio"]'::jsonb,
 true),
('preparatory_call_speaker',
 'Visio préparatoire - Conférencier',
 'event',
 'Envoyé au conférencier pour confirmer la visio préparatoire avec le client.',
 'Visio préparatoire — Conférence du {{date_evenement}} — {{client}}',
 '<p>Bonjour {{prenom_conferencier}},</p>
<p>Afin de bien préparer ton intervention pour <strong>{{client}}</strong> le <strong>{{date_evenement}}</strong>, une visio préparatoire est organisée avec le client.</p>
<p>Voici les modalités :</p>
<ul>
<li>📅 Date : <strong>{{date_visio}}</strong></li>
<li>🕐 Heure : <strong>{{heure_visio}}</strong></li>
<li>🔗 Lien visio : <strong>{{lien_visio}}</strong></li>
</ul>
<p>Merci de me confirmer ta disponibilité.</p>
<p>À très vite !</p>
<p>Nelly Sabde - Les Conférenciers</p>',
 'Visio préparatoire — Conférence du {{date_evenement}} — {{client}}',
 '',
 '["prenom_conferencier","client","date_evenement","date_visio","heure_visio","lien_visio"]'::jsonb,
 true);