
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  trigger_description text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  default_subject text NOT NULL DEFAULT '',
  default_body_html text NOT NULL DEFAULT '',
  available_variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read email templates"
  ON public.email_templates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can update email templates"
  ON public.email_templates FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.email_templates_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.email_templates_set_updated_at();

-- Seed: insertion des templates avec leur contenu actuel
-- Variables communes
-- prenom_destinataire, nom_destinataire, email_destinataire, nom_client (société),
-- date_evenement, lieu_evenement, auditoire, conferencier, tarif_conferencier,
-- url_proposition, nb_jours_restants, numero_relance, numero_bdc, numero_facture,
-- montant_ttc, agent_nom, agent_telephone, agent_email

INSERT INTO public.email_templates (key, name, category, trigger_description, subject, body_html, default_subject, default_body_html, available_variables) VALUES
(
  'proposal_classic',
  'Proposition — sélection multi-conférenciers',
  'proposal',
  'Envoyé lorsqu''une proposition de type « Classique » (plusieurs profils) est expédiée au client depuis l''admin.',
  'Votre sélection de conférenciers sur mesure - {{nom_client}}',
  '<p>Bonjour {{prenom_destinataire}},</p>

<p>Suite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d''intervenants.</p>

<p>Vous trouverez ci-joint une sélection de conférenciers (sous réserve de leur disponibilité) pour votre événement du <strong>{{date_evenement}}</strong>, qui se tiendra à <strong>{{lieu_evenement}}</strong>, devant un auditoire d''environ <strong>{{auditoire}} personnes</strong>.</p>

<p>Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d''hébergement et de restauration.</p>

<p><strong>👉 Cliquez sur le bouton ci-dessous pour découvrir votre sélection.</strong></p>

<p>Je reste bien entendu à votre disposition pour tout complément d''information.</p>

<p>Dans l''attente de votre retour, je vous souhaite une très belle journée.</p>

<p>{{agent_nom}} - Les Conférenciers<br>📞 {{agent_telephone}}</p>',
  'Votre sélection de conférenciers sur mesure - {{nom_client}}',
  '<p>Bonjour {{prenom_destinataire}},</p>

<p>Suite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d''intervenants.</p>

<p>Vous trouverez ci-joint une sélection de conférenciers (sous réserve de leur disponibilité) pour votre événement du <strong>{{date_evenement}}</strong>, qui se tiendra à <strong>{{lieu_evenement}}</strong>, devant un auditoire d''environ <strong>{{auditoire}} personnes</strong>.</p>

<p>Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d''hébergement et de restauration.</p>

<p><strong>👉 Cliquez sur le bouton ci-dessous pour découvrir votre sélection.</strong></p>

<p>Je reste bien entendu à votre disposition pour tout complément d''information.</p>

<p>Dans l''attente de votre retour, je vous souhaite une très belle journée.</p>

<p>{{agent_nom}} - Les Conférenciers<br>📞 {{agent_telephone}}</p>',
  '[
    {"key":"prenom_destinataire","label":"Prénom du destinataire","example":"Véronique"},
    {"key":"nom_client","label":"Société cliente","example":"BDO"},
    {"key":"date_evenement","label":"Date de l''événement","example":"15 octobre 2026"},
    {"key":"lieu_evenement","label":"Lieu","example":"Paris"},
    {"key":"auditoire","label":"Taille de l''auditoire","example":"200"},
    {"key":"url_proposition","label":"Lien vers la proposition","example":"https://www.lesconferenciers.com/proposition/xxx"},
    {"key":"agent_nom","label":"Nom de l''agent","example":"Nelly Sabde"},
    {"key":"agent_telephone","label":"Téléphone agent","example":"06 95 93 97 91"}
  ]'::jsonb
),
(
  'proposal_unique',
  'Proposition — conférencier unique',
  'proposal',
  'Envoyé lorsqu''une proposition de type « Unique » (un seul conférencier ciblé) est expédiée au client.',
  'Votre conférencier sur mesure - {{nom_client}}',
  '<p>Bonjour {{prenom_destinataire}},</p>

<p>Je fais suite à votre mail et à ma tentative de vous joindre par téléphone.</p>

<p>Je suis ravie de pouvoir vous accompagner dans votre recherche d''intervenants concernant votre événement du <strong>{{date_evenement}}</strong>, qui aura lieu à <strong>{{lieu_evenement}}</strong>, pour un auditoire d''environ <strong>{{auditoire}} personnes</strong>, et vous adresse, comme convenu, le profil de {{conferencier}}. Le tarif de son intervention est de {{tarif_conferencier}} € HT, hors frais VHR.</p>

<p><strong>👉 <a href="{{url_proposition}}">Découvrir le profil de {{conferencier}}</a></strong> (sous réserve de sa disponibilité)</p>

<p>Si toutefois ce profil ne correspondait pas pleinement à vos attentes, je serais heureuse de vous proposer d''autres intervenants adaptés à vos critères.</p>

<p><strong>👉 À ce titre, pourriez-vous m''indiquer la taille de l''auditoire envisagé ainsi que l''enveloppe budgétaire disponible ?</strong></p>

<p>Je reste bien entendu à votre entière disposition pour tout complément d''information.</p>

<p>Dans l''attente de votre retour, je vous souhaite une très belle journée.</p>

<p>{{agent_nom}} - Les Conférenciers<br>📞 {{agent_telephone}}</p>',
  'Votre conférencier sur mesure - {{nom_client}}',
  '<p>Bonjour {{prenom_destinataire}},</p>

<p>Je fais suite à votre mail et à ma tentative de vous joindre par téléphone.</p>

<p>Je suis ravie de pouvoir vous accompagner dans votre recherche d''intervenants concernant votre événement du <strong>{{date_evenement}}</strong>, qui aura lieu à <strong>{{lieu_evenement}}</strong>, pour un auditoire d''environ <strong>{{auditoire}} personnes</strong>, et vous adresse, comme convenu, le profil de {{conferencier}}. Le tarif de son intervention est de {{tarif_conferencier}} € HT, hors frais VHR.</p>

<p><strong>👉 <a href="{{url_proposition}}">Découvrir le profil de {{conferencier}}</a></strong> (sous réserve de sa disponibilité)</p>

<p>Si toutefois ce profil ne correspondait pas pleinement à vos attentes, je serais heureuse de vous proposer d''autres intervenants adaptés à vos critères.</p>

<p><strong>👉 À ce titre, pourriez-vous m''indiquer la taille de l''auditoire envisagé ainsi que l''enveloppe budgétaire disponible ?</strong></p>

<p>Je reste bien entendu à votre entière disposition pour tout complément d''information.</p>

<p>Dans l''attente de votre retour, je vous souhaite une très belle journée.</p>

<p>{{agent_nom}} - Les Conférenciers<br>📞 {{agent_telephone}}</p>',
  '[
    {"key":"prenom_destinataire","label":"Prénom","example":"Véronique"},
    {"key":"nom_client","label":"Société","example":"BDO"},
    {"key":"conferencier","label":"Nom du conférencier","example":"Philippe Étienne"},
    {"key":"tarif_conferencier","label":"Tarif HT","example":"5 500"},
    {"key":"date_evenement","label":"Date","example":"15 octobre 2026"},
    {"key":"lieu_evenement","label":"Lieu","example":"Paris"},
    {"key":"auditoire","label":"Auditoire","example":"200"},
    {"key":"url_proposition","label":"Lien profil/proposition","example":"https://..."},
    {"key":"agent_nom","label":"Agent","example":"Nelly Sabde"},
    {"key":"agent_telephone","label":"Téléphone","example":"06 95 93 97 91"}
  ]'::jsonb
),
(
  'proposal_info',
  'Demande d''informations complémentaires',
  'proposal',
  'Envoyé quand la proposition créée est de type « Demande d''infos » (avant d''envoyer une vraie sélection).',
  'Demande d''informations - {{nom_client}}',
  'Bonjour {{prenom_destinataire}},

Merci pour votre message. J''ai tenté de vous joindre par téléphone sans succès et me permets donc de revenir vers vous par écrit.

Je serais ravie de vous accompagner dans votre recherche d''intervenants. Afin de pouvoir vous proposer des profils parfaitement adaptés à vos besoins, pourriez-vous m''apporter quelques précisions concernant :

• La taille de l''auditoire
• Le profil des participants (commerciaux, managers, experts, etc.)
• La durée souhaitée pour l''intervention
• La thématique à aborder
• Votre enveloppe budgétaire

Ces informations me permettront de cibler au mieux les conférenciers à vous suggérer.

Je reste bien entendu à votre disposition pour en discuter de vive voix si vous le souhaitez.

Dans l''attente de votre retour, je vous souhaite une très belle journée.

{{agent_nom}} - Les Conférenciers
📞 {{agent_telephone}}',
  'Demande d''informations - {{nom_client}}',
  'Bonjour {{prenom_destinataire}},

Merci pour votre message. J''ai tenté de vous joindre par téléphone sans succès et me permets donc de revenir vers vous par écrit.

Je serais ravie de vous accompagner dans votre recherche d''intervenants. Afin de pouvoir vous proposer des profils parfaitement adaptés à vos besoins, pourriez-vous m''apporter quelques précisions concernant :

• La taille de l''auditoire
• Le profil des participants (commerciaux, managers, experts, etc.)
• La durée souhaitée pour l''intervention
• La thématique à aborder
• Votre enveloppe budgétaire

Ces informations me permettront de cibler au mieux les conférenciers à vous suggérer.

Je reste bien entendu à votre disposition pour en discuter de vive voix si vous le souhaitez.

Dans l''attente de votre retour, je vous souhaite une très belle journée.

{{agent_nom}} - Les Conférenciers
📞 {{agent_telephone}}',
  '[
    {"key":"prenom_destinataire","label":"Prénom","example":"Véronique"},
    {"key":"nom_client","label":"Société","example":"BDO"},
    {"key":"agent_nom","label":"Agent","example":"Nelly Sabde"},
    {"key":"agent_telephone","label":"Téléphone","example":"06 95 93 97 91"}
  ]'::jsonb
),
(
  'proposal_reminder_1_classic',
  'Relance J+7 — proposition classique',
  'reminder',
  'Première relance envoyée 7 jours après l''envoi d''une proposition « Classique ».',
  'Votre sélection de conférenciers - {{nom_client}}',
  'Bonjour {{prenom_destinataire}},

J''espère que vous allez bien !

Je me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d''intervenants 🙂

Je souhaitais savoir si un des profils avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.

Je reste bien évidemment à votre disposition si besoin est.

Dans l''attente de votre retour.

Très belle fin de journée à vous.',
  'Votre sélection de conférenciers - {{nom_client}}',
  'Bonjour {{prenom_destinataire}},

J''espère que vous allez bien !

Je me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d''intervenants 🙂

Je souhaitais savoir si un des profils avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.

Je reste bien évidemment à votre disposition si besoin est.

Dans l''attente de votre retour.

Très belle fin de journée à vous.',
  '[
    {"key":"prenom_destinataire","label":"Prénom","example":"Véronique"},
    {"key":"nom_client","label":"Société","example":"BDO"}
  ]'::jsonb
),
(
  'proposal_reminder_2_classic',
  'Relance J+15 — proposition classique',
  'reminder',
  'Seconde relance envoyée 15 jours après l''envoi d''une proposition « Classique ».',
  'Rappel : votre recherche d''intervenants - {{nom_client}}',
  'Bonjour {{prenom_destinataire}},

Je reviens vers vous suite à nos précédents échanges concernant votre recherche d''intervenants 🙂

Je souhaitais savoir si vous aviez pu avancer dans votre réflexion quant au choix de l''intervenant qui correspondrait le mieux à vos besoins.

Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.

Dans l''attente de votre retour, je vous souhaite une très belle fin de journée.',
  'Rappel : votre recherche d''intervenants - {{nom_client}}',
  'Bonjour {{prenom_destinataire}},

Je reviens vers vous suite à nos précédents échanges concernant votre recherche d''intervenants 🙂

Je souhaitais savoir si vous aviez pu avancer dans votre réflexion quant au choix de l''intervenant qui correspondrait le mieux à vos besoins.

Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.

Dans l''attente de votre retour, je vous souhaite une très belle fin de journée.',
  '[
    {"key":"prenom_destinataire","label":"Prénom","example":"Véronique"},
    {"key":"nom_client","label":"Société","example":"BDO"}
  ]'::jsonb
),
(
  'proposal_reminder_1_unique',
  'Relance J+7 — conférencier unique',
  'reminder',
  'Première relance envoyée 7 jours après une proposition « Unique » (mono-conférencier).',
  'Votre sélection de conférenciers - {{nom_client}}',
  'Bonjour,

J''espère que vous allez bien ! 🙂

Je me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d''intervenants.

Je souhaitais savoir si le profil de {{conferencier}} avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.

Je reste bien évidemment à votre disposition si besoin est.

Dans l''attente de votre retour.

Très belle fin de journée à vous.',
  'Votre sélection de conférenciers - {{nom_client}}',
  'Bonjour,

J''espère que vous allez bien ! 🙂

Je me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d''intervenants.

Je souhaitais savoir si le profil de {{conferencier}} avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.

Je reste bien évidemment à votre disposition si besoin est.

Dans l''attente de votre retour.

Très belle fin de journée à vous.',
  '[
    {"key":"conferencier","label":"Conférencier","example":"Philippe Étienne"},
    {"key":"nom_client","label":"Société","example":"BDO"}
  ]'::jsonb
),
(
  'proposal_reminder_2_unique',
  'Relance J+15 — conférencier unique',
  'reminder',
  'Seconde relance envoyée 15 jours après une proposition « Unique ».',
  'Rappel : votre recherche d''intervenants - {{nom_client}}',
  'Bonjour,

Je reviens vers vous suite à nos précédents échanges concernant votre recherche d''intervenants. 🙂

Je souhaitais savoir si l''intervention de {{conferencier}} était toujours d''actualité.

Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.

Dans l''attente de votre retour, je vous souhaite une très belle fin de journée.

Bien à vous,',
  'Rappel : votre recherche d''intervenants - {{nom_client}}',
  'Bonjour,

Je reviens vers vous suite à nos précédents échanges concernant votre recherche d''intervenants. 🙂

Je souhaitais savoir si l''intervention de {{conferencier}} était toujours d''actualité.

Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.

Dans l''attente de votre retour, je vous souhaite une très belle fin de journée.

Bien à vous,',
  '[
    {"key":"conferencier","label":"Conférencier","example":"Philippe Étienne"},
    {"key":"nom_client","label":"Société","example":"BDO"}
  ]'::jsonb
),
(
  'proposal_reminder_info',
  'Relance — demande d''infos',
  'reminder',
  'Relance pour une proposition de type « Demande d''infos » restée sans réponse.',
  'Rappel : votre recherche d''intervenants - {{nom_client}}',
  'Bonjour,

Je reviens vers vous suite à mon précédent mail.

Avez-vous pu en prendre connaissance ?

Votre recherche d''intervenant est-elle toujours d''actualité ?

Vous remerciant par avance de votre retour et restant à votre écoute, je vous souhaite une excellente journée.',
  'Rappel : votre recherche d''intervenants - {{nom_client}}',
  'Bonjour,

Je reviens vers vous suite à mon précédent mail.

Avez-vous pu en prendre connaissance ?

Votre recherche d''intervenant est-elle toujours d''actualité ?

Vous remerciant par avance de votre retour et restant à votre écoute, je vous souhaite une excellente journée.',
  '[]'::jsonb
),
(
  'lead_confirmation',
  'Confirmation de lead — accusé de réception',
  'lead',
  'Envoyé automatiquement au prospect dès qu''un formulaire de contact ou le simulateur est soumis.',
  'Votre demande a bien été reçue - Les Conférenciers',
  '<p>Bonjour {{prenom_destinataire}},</p>
<p>Nous avons bien reçu votre demande et reviendrons vers vous très rapidement avec une sélection adaptée.</p>
<p>Très belle journée,<br>{{agent_nom}} - Les Conférenciers<br>📞 {{agent_telephone}}</p>',
  'Votre demande a bien été reçue - Les Conférenciers',
  '<p>Bonjour {{prenom_destinataire}},</p>
<p>Nous avons bien reçu votre demande et reviendrons vers vous très rapidement avec une sélection adaptée.</p>
<p>Très belle journée,<br>{{agent_nom}} - Les Conférenciers<br>📞 {{agent_telephone}}</p>',
  '[
    {"key":"prenom_destinataire","label":"Prénom","example":"Véronique"},
    {"key":"agent_nom","label":"Agent","example":"Nelly Sabde"},
    {"key":"agent_telephone","label":"Téléphone","example":"06 95 93 97 91"}
  ]'::jsonb
),
(
  'contract_to_client',
  'Bon de commande (BDC) envoyé au client',
  'contract',
  'Envoyé au client lors de la transmission du bon de commande / contrat de prestation depuis l''admin contrats.',
  'Contrat de prestation - {{nom_client}} - Les Conférenciers',
  '<p>Bonjour {{prenom_destinataire}},</p>
<p>Comme convenu, veuillez trouver le contrat de prestation pour votre événement.</p>
<p>Bien cordialement,<br>{{agent_nom}} - Les Conférenciers</p>',
  'Contrat de prestation - {{nom_client}} - Les Conférenciers',
  '<p>Bonjour {{prenom_destinataire}},</p>
<p>Comme convenu, veuillez trouver le contrat de prestation pour votre événement.</p>
<p>Bien cordialement,<br>{{agent_nom}} - Les Conférenciers</p>',
  '[
    {"key":"prenom_destinataire","label":"Prénom","example":"Véronique"},
    {"key":"nom_client","label":"Société","example":"BDO"},
    {"key":"numero_bdc","label":"Numéro BDC","example":"BDC-2026-014"},
    {"key":"agent_nom","label":"Agent","example":"Nelly Sabde"}
  ]'::jsonb
),
(
  'invoice_to_client',
  'Facture envoyée au client',
  'invoice',
  'Envoyé lors de la transmission d''une facture depuis l''admin facturation.',
  'Facture {{numero_facture}} - {{nom_client}}',
  'Bonjour,

Veuillez trouver votre facture {{numero_facture}}.

Cordialement,
{{agent_nom}} - Les Conférenciers',
  'Facture {{numero_facture}} - {{nom_client}}',
  'Bonjour,

Veuillez trouver votre facture {{numero_facture}}.

Cordialement,
{{agent_nom}} - Les Conférenciers',
  '[
    {"key":"numero_facture","label":"N° de facture","example":"20261015-014"},
    {"key":"nom_client","label":"Société","example":"BDO"},
    {"key":"montant_ttc","label":"Montant TTC","example":"6 600"},
    {"key":"agent_nom","label":"Agent","example":"Nelly Sabde"}
  ]'::jsonb
);
