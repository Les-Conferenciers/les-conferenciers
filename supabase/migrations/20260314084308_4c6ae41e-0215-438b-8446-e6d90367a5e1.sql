
-- Régis Rossi: from scraping "Illusionniste et conférencier motivateur"
UPDATE speakers SET specialty = 'Illusionniste et Conférencier Motivateur' WHERE id = '45b5b64c-16d3-418e-97fa-0bd746458d88';

-- Stéphane Gauthier: metier vide, dérivé des pépites (ancien DG Best Western, prof ESSEC)
UPDATE speakers SET specialty = 'Expert en Expérience Client et Stratégie Digitale' WHERE id = 'c9ef0cf0-54df-4159-9454-46c0278ba13e';

-- Nicolas Felger: metier vide, dérivé des pépites "Aventurier de l''extrême"
UPDATE speakers SET specialty = 'Aventurier de l''Extrême et Expert en Performance' WHERE id = '14ff5819-9475-4697-8461-a438490c1e3f';

-- Fred Colantonio: enlever "Psychologue du Travail"
UPDATE speakers SET specialty = 'Criminologue' WHERE id = 'b301b75c-71d6-452a-a716-90c315681919';

-- François Dolveck: enlever MBA, dérivé des pépites
UPDATE speakers SET specialty = 'Médecin Urgentiste et Directeur du SAMU' WHERE id = 'ba31916a-d7c9-4e4d-8ce0-3bd1e5113863';

-- Julien Estier: "expert des jeunes générations" (instruction utilisateur + pépites)
UPDATE speakers SET specialty = 'Expert en Management des Jeunes Générations' WHERE id = '5712c2f2-e123-428f-ae6f-5e79290eb2ed';

-- John Rauscher: instruction utilisateur "serial entrepreneur, expert en IA"
UPDATE speakers SET specialty = 'Serial Entrepreneur et Expert en IA' WHERE id = 'e223fa73-82c6-43bb-83cd-ffa1ecc9de7c';

-- Guillaume Antoine: enlever "Homme de Cheval", indiquer "expert en équicoaching"
UPDATE speakers SET specialty = 'Expert en Équicoaching et Entraîneur International' WHERE id = '42eb5d4e-fe24-4e68-b2ba-08a3d6cf74c1';

-- Vincent Fournier: instruction utilisateur
UPDATE speakers SET specialty = 'Expert en Relations Clients et en Négociation' WHERE id = '84033b31-a0ca-42cb-8197-619e150f9d78';

-- Bruno Marion: metier vide, dérivé des pépites "consultant incertitude, auteur Chaos mode d''emploi"
UPDATE speakers SET specialty = 'Expert en Chaos et Incertitude, Auteur et Conférencier International' WHERE id = 'db80281f-2926-45d3-8ee4-e6bec0502307';

-- Laurent Beretta: "illusionniste" plutôt que "magicien"
UPDATE speakers SET specialty = 'Illusionniste, Expert Marketing & Neurosciences' WHERE id = 'b43f0dc5-196b-4b06-bb00-74ddfc7edeee';

-- Juliette Lepage: metier vide, dérivé des pépites "Triple A, rallye des Gazelles"
UPDATE speakers SET specialty = 'Aventurière et Conférencière Triple A' WHERE id = '382aaaf7-5c2e-4499-896e-908eb455cbc3';

-- Laurent Boghossian: metier vide, dérivé des pépites "Humoriste, auteur spectacle"
UPDATE speakers SET specialty = 'Humoriste et Conférencier' WHERE id = '86d5f18c-6ef1-417f-889e-00b18f17a1ff';

-- Benoît Lebot: "expert en transition énergétique" uniquement
UPDATE speakers SET specialty = 'Expert en Transition Énergétique' WHERE id = '60a7fe2f-f2ec-433d-acbd-ec403041e714';

-- Vanessa Beaudoin: ajouter "humoriste"
UPDATE speakers SET specialty = 'Experte en Bonheur au Travail et Humoriste' WHERE id = '1e4e5795-25cb-42ca-a6fd-59b12c1aa786';

-- Vincent Boichard: metier vide, dérivé des pépites "Pompier-expert, Coach HEC"
UPDATE speakers SET specialty = 'Pompier-Expert et Executive Coach HEC' WHERE id = '8c5e0855-8b1a-4605-9f14-e904aaf72ad5';

-- Laurent Alexandre: "fondateur de Doctolib et futurologue"
UPDATE speakers SET specialty = 'Fondateur de Doctolib et Futurologue' WHERE id = 'ded5156d-ae99-4fbe-850a-9456363f4fe8';

-- Malek Boukerchi: "ultra-traileur et écrivain"
UPDATE speakers SET specialty = 'Ultra-Traileur et Écrivain' WHERE id = '1d7e3fb1-7582-45e5-94e4-4990fbc96c17';

-- Jean Galfione: ajouter "marin"
UPDATE speakers SET specialty = 'Champion Olympique de Saut à la Perche et Marin' WHERE id = '47668be3-f47e-4b80-a46d-ac34d9503b49';

-- Jean-Philippe Ackermann: "expert en optimisme et motivation"
UPDATE speakers SET specialty = 'Expert en Optimisme et Motivation' WHERE id = '386f1132-ebcd-457f-9bbe-5088317c1ffc';

-- Justine Henin: ajouter "chroniqueuse"
UPDATE speakers SET specialty = 'Championne de Tennis N°1 Mondiale et Chroniqueuse' WHERE id = 'e3635b48-4c85-4811-bd53-b2e72b5f939e';

-- Romain Barnier: ajouter "entraîneur"
UPDATE speakers SET specialty = 'Ancien Nageur Professionnel et Entraîneur' WHERE id = 'a2736865-aac0-4de8-89b0-7c6882ee1d17';

-- Marlène Legay: dérivé des pépites "Psychosociologue, Experte des Jeunes Générations"
UPDATE speakers SET specialty = 'Psychosociologue et Experte des Jeunes Générations' WHERE id = '7094a6f2-f2a3-4bb2-9888-72b042466731';

-- Thaïs Herbreteau: "comédienne et experte des jeunes générations"
UPDATE speakers SET specialty = 'Comédienne et Experte des Jeunes Générations' WHERE id = 'f15bb12b-023d-454d-9ec5-4b7a77b08538';

-- Alexandre Kateb: "économiste et maître de conférences à Sciences Po"
UPDATE speakers SET specialty = 'Économiste et Maître de Conférences à Sciences Po' WHERE id = 'af3d4fbd-ac52-41e8-b5f8-5728c3532a69';

-- Isabelle Autissier: "navigatrice et présidente de WWF France"
UPDATE speakers SET specialty = 'Navigatrice et Présidente de WWF France' WHERE id = 'fc43f8c5-2093-4229-8098-f839afd52797';

-- Annika Månsson: "fondatrice de Happy at Work et experte en bien-être au travail"
UPDATE speakers SET specialty = 'Fondatrice de Happy at Work et Experte en Bien-être au Travail' WHERE id = 'aa588bef-1b86-4508-907c-68a8f482d055';

-- Olivier Bas: "ancien vice-président d''Havas Conseil"
UPDATE speakers SET specialty = 'Ancien Vice-Président d''Havas Conseil' WHERE id = 'a1346aad-d743-4975-9bd8-fe2b57f12505';

-- Michel Poulaert: dérivé des pépites "Conférencier professionnel certifié CSP, expert optimisme et audace"
UPDATE speakers SET specialty = 'Conférencier Professionnel, Expert en Optimisme et Audace' WHERE id = 'b6a94f22-df6a-4504-b310-bbc7bfff8286';
