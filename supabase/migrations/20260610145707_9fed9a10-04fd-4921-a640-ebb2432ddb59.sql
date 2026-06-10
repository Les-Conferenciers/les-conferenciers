
-- 1) Add {{conferencier}} variable to BDC client template
UPDATE public.email_templates
SET available_variables = available_variables || jsonb_build_array(
  jsonb_build_object('key','conferencier','label','Conférencier(s)','example','Marc Lievremont')
)
WHERE key = 'contract_to_client'
  AND NOT (available_variables::text LIKE '%"conferencier"%');

-- Ensure the default body mentions {{conferencier}} (only if user hasn't customized — i.e., body still equals default_body_html)
UPDATE public.email_templates
SET 
  default_body_html = '<p>Bonjour {{prenom_destinataire}},</p>
<p>Suite à nos précédents échanges, je suis ravie de vous adresser le bon de commande relatif à l''intervention de <strong>{{conferencier}}</strong>.</p>
<p><strong>📋 Récapitulatif :</strong></p>
<ul>
<li>Conférencier(s) : {{conferencier}}</li>
<li>Date : {{date_evenement}}</li>
<li>Lieu : {{lieu_evenement}}</li>
<li>Montant total TTC : {{montant_ttc}} €</li>
</ul>
<p>👉 Vous pouvez consulter le bon de commande et le signer électroniquement en cliquant sur le bouton ci-dessous.</p>
<p>N''hésitez pas à me contacter si vous avez la moindre question, je reste à votre entière disposition.<br>
Dans l''attente de votre retour, je vous souhaite une très belle journée.</p>
<p>Bien cordialement,<br>
Nelly Sabde — Les Conférenciers</p>',
  body_html = CASE 
    WHEN body_html = default_body_html OR body_html IS NULL OR body_html = '' 
    THEN '<p>Bonjour {{prenom_destinataire}},</p>
<p>Suite à nos précédents échanges, je suis ravie de vous adresser le bon de commande relatif à l''intervention de <strong>{{conferencier}}</strong>.</p>
<p><strong>📋 Récapitulatif :</strong></p>
<ul>
<li>Conférencier(s) : {{conferencier}}</li>
<li>Date : {{date_evenement}}</li>
<li>Lieu : {{lieu_evenement}}</li>
<li>Montant total TTC : {{montant_ttc}} €</li>
</ul>
<p>👉 Vous pouvez consulter le bon de commande et le signer électroniquement en cliquant sur le bouton ci-dessous.</p>
<p>N''hésitez pas à me contacter si vous avez la moindre question, je reste à votre entière disposition.<br>
Dans l''attente de votre retour, je vous souhaite une très belle journée.</p>
<p>Bien cordialement,<br>
Nelly Sabde — Les Conférenciers</p>'
    ELSE body_html
  END
WHERE key = 'contract_to_client';

-- Also enrich available_variables with date/lieu/montant if missing
UPDATE public.email_templates
SET available_variables = available_variables || jsonb_build_array(
  jsonb_build_object('key','date_evenement','label','Date événement','example','12 mars 2026'),
  jsonb_build_object('key','lieu_evenement','label','Lieu','example','Paris'),
  jsonb_build_object('key','montant_ttc','label','Montant TTC','example','3 600,00')
)
WHERE key = 'contract_to_client'
  AND NOT (available_variables::text LIKE '%"date_evenement"%');

-- 2) Insert 5 new templates
INSERT INTO public.email_templates (key, name, category, trigger_description, subject, body_html, default_subject, default_body_html, available_variables, is_active)
VALUES
('contract_to_speaker',
 'Contrat agence envoyé au conférencier',
 'contract',
 'Envoyé au conférencier avec le contrat agence (bouton « Envoyer le contrat » dans le dossier événement).',
 'Bon de commande — Conférence du {{date_evenement}} — {{client}}',
 '<p>Bonjour {{prenom_conferencier}},</p>
<p>Veuillez trouver ci-joint le bon de commande pour votre intervention :</p>
<ul>
<li>📅 Date : <strong>{{date_evenement}}</strong></li>
<li>📍 Lieu : <strong>{{lieu_evenement}}</strong></li>
<li>🏢 Client : <strong>{{client}}</strong></li>
<li>💰 Budget : <strong>{{budget}} € HT, hors frais VHR</strong></li>
</ul>
<p><strong>Pourriez-vous m''accuser réception de ce mail ?</strong> Merci de me retourner le contrat signé dès que possible.</p>
<p>Restant à votre disposition.</p>
<p>Nelly Sabde — Les Conférenciers</p>',
 'Bon de commande — Conférence du {{date_evenement}} — {{client}}',
 '<p>Bonjour {{prenom_conferencier}},</p>
<p>Veuillez trouver ci-joint le bon de commande pour votre intervention :</p>
<ul>
<li>📅 Date : <strong>{{date_evenement}}</strong></li>
<li>📍 Lieu : <strong>{{lieu_evenement}}</strong></li>
<li>🏢 Client : <strong>{{client}}</strong></li>
<li>💰 Budget : <strong>{{budget}} € HT, hors frais VHR</strong></li>
</ul>
<p><strong>Pourriez-vous m''accuser réception de ce mail ?</strong> Merci de me retourner le contrat signé dès que possible.</p>
<p>Restant à votre disposition.</p>
<p>Nelly Sabde — Les Conférenciers</p>',
 '[
   {"key":"prenom_conferencier","label":"Prénom conférencier","example":"Marc"},
   {"key":"date_evenement","label":"Date","example":"12 mars 2026"},
   {"key":"lieu_evenement","label":"Lieu","example":"Paris"},
   {"key":"client","label":"Client","example":"BDO"},
   {"key":"budget","label":"Budget HT","example":"3 500"}
 ]'::jsonb,
 true),

('speaker_event_info',
 'Infos événement envoyées au conférencier',
 'contract',
 'Envoyé au conférencier avec toutes les informations pratiques (bouton « Envoyer les infos » dans le dossier événement).',
 'Conférence du {{date_evenement}} — {{client}}',
 '<p>Bonjour {{prenom_conferencier}},</p>
<p>Voici comme convenu les informations concernant votre intervention :</p>
<ul>
<li>📅 Date : <strong>{{date_evenement}}</strong></li>
<li>📍 Lieu : <strong>{{lieu_evenement}}</strong></li>
<li>🕐 Horaires : <strong>{{horaires}}</strong></li>
<li>🎤 Conférence : <strong>{{titre_conference}}</strong></li>
<li>⏱ Durée : <strong>{{duree}}</strong></li>
<li>👥 Auditoire : <strong>{{auditoire}}</strong></li>
<li>📋 Thématique : <strong>{{theme}}</strong></li>
<li>🏢 Client : <strong>{{client}}</strong></li>
<li>💰 Budget : <strong>{{budget}} € HT, hors frais VHR</strong></li>
<li>👔 Dress code : <strong>{{dress_code}}</strong></li>
</ul>
<p><strong>Pourriez-vous m''accuser réception de ce mail ?</strong></p>
<p>À très bientôt et bonne journée !</p>
<p>Nelly Sabde — Les Conférenciers</p>',
 'Conférence du {{date_evenement}} — {{client}}',
 '<p>Bonjour {{prenom_conferencier}},</p>
<p>Voici comme convenu les informations concernant votre intervention :</p>
<ul>
<li>📅 Date : <strong>{{date_evenement}}</strong></li>
<li>📍 Lieu : <strong>{{lieu_evenement}}</strong></li>
<li>🕐 Horaires : <strong>{{horaires}}</strong></li>
<li>🎤 Conférence : <strong>{{titre_conference}}</strong></li>
<li>⏱ Durée : <strong>{{duree}}</strong></li>
<li>👥 Auditoire : <strong>{{auditoire}}</strong></li>
<li>📋 Thématique : <strong>{{theme}}</strong></li>
<li>🏢 Client : <strong>{{client}}</strong></li>
<li>💰 Budget : <strong>{{budget}} € HT, hors frais VHR</strong></li>
<li>👔 Dress code : <strong>{{dress_code}}</strong></li>
</ul>
<p><strong>Pourriez-vous m''accuser réception de ce mail ?</strong></p>
<p>À très bientôt et bonne journée !</p>
<p>Nelly Sabde — Les Conférenciers</p>',
 '[
   {"key":"prenom_conferencier","label":"Prénom conférencier","example":"Marc"},
   {"key":"date_evenement","label":"Date","example":"12 mars 2026"},
   {"key":"lieu_evenement","label":"Lieu","example":"Paris"},
   {"key":"horaires","label":"Horaires","example":"14h-16h"},
   {"key":"titre_conference","label":"Titre conférence","example":"Leadership"},
   {"key":"duree","label":"Durée","example":"1h30"},
   {"key":"auditoire","label":"Auditoire","example":"200"},
   {"key":"theme","label":"Thématique","example":"Management"},
   {"key":"client","label":"Client","example":"BDO"},
   {"key":"budget","label":"Budget HT","example":"3 500"},
   {"key":"dress_code","label":"Dress code","example":"Tenue de ville"}
 ]'::jsonb,
 true),

('liaison_to_client',
 'Feuille de liaison envoyée au client',
 'contract',
 'Envoyé au client avec la feuille de liaison (bouton « Envoyer au client » dans la pop-up feuille de liaison).',
 'Conférence du {{date_evenement}} — {{client}}',
 '<p>{{prenom_destinataire}},</p>
<p>Un grand merci pour nos échanges !</p>
<p>Vous trouverez ci-joint comme convenu la feuille de liaison pour l''intervention de <strong>{{conferencier}}</strong>, laissant apparaître ses coordonnées téléphoniques.</p>
<p>Vous en souhaitant bonne réception et restant à votre disposition si besoin est.</p>
<p>Excellente fin de journée à vous !</p>
<p>Nelly Sabde — Les Conférenciers</p>',
 'Conférence du {{date_evenement}} — {{client}}',
 '<p>{{prenom_destinataire}},</p>
<p>Un grand merci pour nos échanges !</p>
<p>Vous trouverez ci-joint comme convenu la feuille de liaison pour l''intervention de <strong>{{conferencier}}</strong>, laissant apparaître ses coordonnées téléphoniques.</p>
<p>Vous en souhaitant bonne réception et restant à votre disposition si besoin est.</p>
<p>Excellente fin de journée à vous !</p>
<p>Nelly Sabde — Les Conférenciers</p>',
 '[
   {"key":"prenom_destinataire","label":"Prénom destinataire","example":"Véronique"},
   {"key":"date_evenement","label":"Date","example":"12 mars 2026"},
   {"key":"client","label":"Client","example":"BDO"},
   {"key":"conferencier","label":"Conférencier","example":"Marc Lievremont"}
 ]'::jsonb,
 true),

('liaison_to_speaker',
 'Feuille de liaison envoyée au conférencier',
 'contract',
 'Envoyé au conférencier avec la feuille de liaison (bouton « Envoyer au conférencier » dans la pop-up feuille de liaison).',
 'Conférence du {{date_evenement}} — {{client}}',
 '<p>Bonjour {{prenom_conferencier}},</p>
<p>Voici comme convenu la feuille de liaison pour votre intervention.</p>
<p><strong>Pourriez-vous m''accuser réception de ce mail ?</strong></p>
<p>Je vous souhaite une excellente journée !</p>
<p>Nelly Sabde — Les Conférenciers</p>',
 'Conférence du {{date_evenement}} — {{client}}',
 '<p>Bonjour {{prenom_conferencier}},</p>
<p>Voici comme convenu la feuille de liaison pour votre intervention.</p>
<p><strong>Pourriez-vous m''accuser réception de ce mail ?</strong></p>
<p>Je vous souhaite une excellente journée !</p>
<p>Nelly Sabde — Les Conférenciers</p>',
 '[
   {"key":"prenom_conferencier","label":"Prénom conférencier","example":"Marc"},
   {"key":"date_evenement","label":"Date","example":"12 mars 2026"},
   {"key":"client","label":"Client","example":"BDO"}
 ]'::jsonb,
 true),

('preparatory_call',
 'Visio préparatoire — proposition de créneaux',
 'contract',
 'Envoyé au client et/ou conférencier pour planifier une visio préparatoire.',
 'Visio préparatoire — Conférence du {{date_evenement}}',
 '<p>Bonjour {{prenom_destinataire}},</p>
<p>Afin de bien préparer l''intervention de <strong>{{conferencier}}</strong> pour votre événement du <strong>{{date_evenement}}</strong>, je vous propose d''organiser une courte visio préparatoire (30 min environ).</p>
<p>Voici quelques créneaux possibles :</p>
<ul>
<li>{{creneau_1}}</li>
<li>{{creneau_2}}</li>
<li>{{creneau_3}}</li>
</ul>
<p>N''hésitez pas à me proposer un autre créneau si aucun ne vous convient.</p>
<p>Excellente journée à vous,<br>
Nelly Sabde — Les Conférenciers</p>',
 'Visio préparatoire — Conférence du {{date_evenement}}',
 '<p>Bonjour {{prenom_destinataire}},</p>
<p>Afin de bien préparer l''intervention de <strong>{{conferencier}}</strong> pour votre événement du <strong>{{date_evenement}}</strong>, je vous propose d''organiser une courte visio préparatoire (30 min environ).</p>
<p>Voici quelques créneaux possibles :</p>
<ul>
<li>{{creneau_1}}</li>
<li>{{creneau_2}}</li>
<li>{{creneau_3}}</li>
</ul>
<p>N''hésitez pas à me proposer un autre créneau si aucun ne vous convient.</p>
<p>Excellente journée à vous,<br>
Nelly Sabde — Les Conférenciers</p>',
 '[
   {"key":"prenom_destinataire","label":"Prénom destinataire","example":"Véronique"},
   {"key":"conferencier","label":"Conférencier","example":"Marc Lievremont"},
   {"key":"date_evenement","label":"Date événement","example":"12 mars 2026"},
   {"key":"creneau_1","label":"Créneau 1","example":"Lundi 10/03 à 14h"},
   {"key":"creneau_2","label":"Créneau 2","example":"Mardi 11/03 à 10h"},
   {"key":"creneau_3","label":"Créneau 3","example":"Mercredi 12/03 à 16h"}
 ]'::jsonb,
 true)
ON CONFLICT (key) DO NOTHING;
