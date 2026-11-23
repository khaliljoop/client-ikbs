# IKBS — F00 · Audit de parité fonctionnelle

23 novembre 2026 · Rapport soumis à validation humaine

## Synthèse

La nouvelle plateforme couvre la connexion, les espaces autorisés, l’annuaire et la gestion des organisations. Le premier écart métier est l’espace membre. Flutter y rattache des fiches, des profils, des invitations, des paramètres de cotisation et des statistiques. Fastify possède une première implémentation du domaine Membre en mémoire, sans route HTTP raccordée. Next.js s’arrête au profil d’organisation.

Deux frontières structurent la suite. Une identité de connexion, une appartenance qui porte des droits et une fiche membre métier ont des cycles de vie distincts. Une demande Fastify relève actuellement du niveau plateforme et son approbation change l’état de la demande. La création d’une appartenance, d’un membre ou d’une organisation demande un contrat distinct.

L’audit porte sur les sources locales, les routes enregistrées et les assertions présentes. « Câblé » signifie qu’un parcours est relié statiquement à ses traitements. « Partiel » signifie qu’une pièce manque ou que le parcours complet reste à confirmer. Aucun service, test ni accès à Firebase n’a été exécuté pour F00. L’état des règles Firestore déployées et celui des données historiques restent hors du constat.

## 1. Flutter historique

Les chemins de cette section sont relatifs à `mobile/ikbsregroupement`.

| Module | Parcours et état observés | Modèles, règles et dépendances |
| --- | --- | --- |
| Accueil et accès | Écrans d’accueil, onboarding, connexion et récupération. Le menu donne accès à la déconnexion. Les écrans `login.dart`, `signin.dart`, `resetpassword.dart` et `forgetPass.dart` existent. | `FirebaseService.getLogin` filtre par téléphone et valeur de mot de passe dans `membres`. Des chemins de récupération et d’invitation lisent une valeur de mot de passe et le service comporte un envoi SMTP. Cette pratique ne doit pas être reproduite. La présence des écrans ne démontre pas l’aboutissement de tous les parcours de récupération. |
| Organisations | Consultation, sélection d’un service, informations, image et liens sociaux, puis navigation dans l’espace sélectionné. | `ServiceEntity`, `Socialnetwork`, `getServices`, `getServiceByScode`, `getSocialnetwork`. Le code service sert de pivot aux requêtes dépendantes. |
| Membres | Liste, fiche membre, gestion et profil utilisateur accessibles dans le code. La gestion s’appuie sur la sélection d’un service et sur un contexte de profil. | `MembreEntity`, `Sysuser`, `Sysprofil`, `Responsable`. Lectures par code membre, email ou téléphone et service. Contrôles d’existence dans le service. Les méthodes historiques utilisent plusieurs structures et ne suffisent pas à établir une source unique pour une future reprise. |
| Profils et accès | Résolution du profil par couple service/membre et menus conditionnels. Invitations, récupération, paramètres et administration des demandes apparaissent dans le tiroir selon le contexte. | `user` relie des profils à des services et membres. `profils` est interrogée par identifiant et seuil de code. `menus`, `Smenus` et `actions` sont déclarées. La déclaration seule ne prouve ni un éditeur de rôles ni une politique d’autorisation appliquée à chaque requête Firebase. |
| Demandes | Écran de demande et entrée administrative « Demandes ». Lecture et contrôle préexistant par téléphone/email. `MesDemandes` reste un écran partiel. | `DemandeEntity`, `getDemandes`, `verifiDemandeExist`. Les transitions et effets à préserver côté plateforme doivent être rapprochés de cas métier concrets avant d’élargir le contrat Fastify. |
| Invitations | Écran et lectures des invitations du membre ou du service. Parcours rattaché au service et au profil. | `Invitation`, `getMesInvitation`, `getServiceInvitation`. La lecture historique d’un mot de passe dans cet écran justifie une nouvelle conception pour un éventuel flux d’invitation. |
| Cotisations | Paramétrage accessible depuis le tiroir. Modèles et requêtes pour paramètres, catégories, affectations, montants et cotisations par membre. | `models/param/cotisation.dart`, `services/cotisation_provider.dart`, `repository/cotisation/`. Les lectures croisent service, membre, catégorie, paramètre et année. Plusieurs recherches prennent l’année courante par défaut. La présence des requêtes ne démontre pas un parcours complet de paiement ou de comptabilité. |
| Tableau de bord | Écran de statistiques lié au service, avec sélecteur et compteurs. | `statistiques.dart`, `dashboard_provider.dart`, lectures de comptages membres, événements et paramètres dans le service. Valider le sens exact des agrégats avant de les réutiliser. |
| Événements, aide et contenus | Lectures et comptage des événements côté service. Entrées Guide et WhatsApp dans le tiroir. Lectures de documents et tutoriels, gestion de fichiers dans le service. | `Evenement`, `Document`, `Tutoriel`, Firebase Storage. La lecture d’un modèle ou d’une collection ne démontre pas un module d’administration complet. |

**Persistance observée.** `lib/services/firebase/collection.dart` déclare les collections de premier niveau `services`, `membres`, `user`, `profils`, `responsable`, `demandes`, `invitation`, `forgetpass`, `cotisations`, `mcotisation`, `evenement`, `images`, `documents`, `tutoriel`, `menus`, `Smenus` et `actions`. Sous `services/{scode}`, le service lit notamment `socialnetwork`, `membres`, `spcotisation`, `categoriecotisation`, `mdanscategoriecotisation` et `montantcategoriecotisation`. Des cotisations sont lues sous les fiches de membre via une sous-collection désignée par le code du paramètre. Une autre méthode référence `membre_service` et `membre`. L’inventaire statique établit la coexistence de ces chemins. Leur usage effectif et leur correspondance demandent confirmation. Les préfixes Storage déclarés comprennent `userprofile/`, `imagesdescription/`, `serviceprofile/` et `tutoriel/`.

**Repères.** `lib/main.dart`, `lib/widget/mydrawer.dart`, `lib/screens/`, `lib/models/` et `lib/services/firebase/firebaseservice.dart`. `functions/index.js` contient un exemple d’export commenté. Le test `test/widget_test.dart` est un test compteur de gabarit et ne constitue pas une preuve de couverture des parcours observés.

## 2. Fastify

Les chemins de cette section sont relatifs à `backend/API_IKBS`. Les routes métier et d’authentification sont sous `/api/v1`.

| Module | Domaine, application et persistance | Interface et couverture présente |
| --- | --- | --- |
| Organisations | Entité, identifiant, code, email et cycle `PENDING`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`. Code au format lettre majuscule suivie de sept chiffres. Cas d’usage de création, consultation, liste, édition, statut et suppression, dont deux lectures publiques. Port de repository et adaptateurs mémoire et Firestore. Collection Firestore `service`. | `GET /organizations/public` et `GET /organizations/public/:code` pour l’annuaire public. `GET` et `POST /organizations`, `GET`, `PATCH` et `DELETE /organizations/:id`, `PATCH /organizations/:id/status` pour les usages protégés. Tests entité, objets de valeur, cas d’usage, mappers, repository et HTTP, dont suites Firestore. |
| Demandes | Entité avec identifiant, code et référence. Création, liste, détail, approbation et refus. Repository mémoire ou Firestore `membership_requests`, générateur de référence distinct. Les validations incluent nom, prénom, email, organisation et objectif. L’approbation met à jour la demande seule. | `POST` et `GET /membership-requests`, `GET /membership-requests/:id`, `PATCH /membership-requests/:id/approve` et `…/:id/reject`. Dépôt et revue soumis à des permissions globales distinctes. Tests domaine, cas d’usage, mapping, HTTP et référence Firestore. |
| Membres | Entité et objets de valeur identifiant, code et username. Création, détail et liste, avec validations et vérifications d’unicité dans le cas de création. Port de repository et adaptateur mémoire. Le fichier d’adaptateur Firestore ne fournit pas d’implémentation active. | Aucune route Membre enregistrée dans `src/app/app.ts`. Tests unitaires des objets de valeur, de l’entité, des cas d’usage, du générateur et du repository mémoire. |
| Identités et sessions | Identités, alias, liaison au sujet fournisseur et sessions distinctes. Repositories mémoire et Firestore, dont collections `ikbs_identities_v2`, `ikbs_identity_aliases_v2`, `ikbs_identity_subjects_v2`, `ikbs_sessions_v2` et `ikbs_login_limits_v2`. Cookie de session opaque, HttpOnly et Secure, contrôle d’origine et d’en-tête pour les mutations, quotas par alias et IP. | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`. Tests de service et de stockage Firestore, de bootstrap Firebase test et d’isolation selon les gardes du projet. |
| Autorisations | `SUPER_ADMIN` porte les trois permissions globales `organizations.global.manage`, `requests.platform.submit` et `requests.platform.review`. `ORGANIZATION_ADMIN` actif a `organization.read` et `organization.profile.update`. `MEMBER` actif reçoit les permissions explicitement attribuées. Appartenance inactive sans permission locale. Grant stocké dans `ikbs_authorizations_v2`. | Les routes d’organisation distinguent registre global et périmètre local. Création, statut et suppression exigent la gestion globale. Lecture et modification du profil peuvent être locales selon la politique. Tests HTTP et Firestore d’autorisation et tests des fixtures d’utilisateurs locaux. Aucune API d’administration des rôles relevée. |

**Repères.** `src/app/app.ts`, `src/modules/{organizations,membership-requests,members,auth,authorization}/`, `src/modules/authorization/presentation/business-access.ts`, `src/modules/authorization/domain/policy.ts`, `src/config/firebase.ts` et `tests/`. Les seeds de développement sont des outils de fixtures. Ils ne constituent pas un parcours métier de provisionnement dans l’interface.

## 3. Next.js

| Page ou groupe | Actifs réutilisables et parcours | Limite actuelle |
| --- | --- | --- |
| `/`, `/organisations`, `/organisations/[organizationCode]` | Accueil, annuaire public et fiche. `OrganizationPublicList`, `OrganizationPublicCard` et client API des organisations. | Périmètre de lecture publique défini par Fastify. Les données et codes Flutter nécessitent un mapping explicite. |
| `/login`, `/espaces` | Formulaire de connexion, sélection d’espace, destination interne filtrée et états sans accès. `src/lib/api/auth.ts` et logique de parcours sous `src/lib/auth/`. | Aucun parcours utilisateur de récupération ni de gestion des invitations relevé dans les pages actuelles. |
| `/dash`, `/dash/organisations` | Accueil global et gestion paginée des organisations, formulaires partagés, contrôle des capacités, actions CRUD et statut. | Aucun écran de file de demandes ou d’administration des accès relevé. |
| `/espace/[organizationCode]` | Chargement de session et vérification du périmètre, lecture du profil et édition lorsque la permission est présente. `OrganizationWorkspace`, formulaire organisation, layout et menu contextuel. | Le menu local n’expose que le profil d’organisation. Pas de page Liste des membres, Invitations, Rôles, Cotisations ou Statistiques métier. |
| `/data-table-demo` et composants partagés | Tableau réutilisable, layouts, dialogues, notifications et composants de formulaire. | La démonstration de tableau ne constitue pas un registre métier. |

Les appels utilisent `src/lib/api/{client,auth,organizations,origin}.ts` et la réécriture de `next.config.ts` vers Fastify. Le client utilise `no-store` et les décisions de rendu privé s’appuient sur la session et les capacités renvoyées par Fastify. Le menu reflète les capacités et l’autorisation de chaque requête reste côté serveur. Les fichiers `tests/auth.test.mjs` et `tests/auth-browser.test.mjs` apportent une couverture de contrat et de parcours auth avec des réponses de test. Cette couverture ne constitue pas une preuve d’intégration de tous les modules.

## 4. Matrice de parité

P0 identifie un socle à préserver ou un arbitrage préalable à l’ouverture de nouvelles routes. P1 couvre les parcours métier structurants. P2 couvre les fonctions dépendantes. P3 regroupe les parcours secondaires ou à confirmer.

| Module | Fonctionnalité Flutter | Backend Fastify | Frontend Next.js | Écart | Priorité |
| --- | --- | --- | --- | --- | --- |
| Accès | Connexion et déconnexion | Login, session et logout | Connexion et déconnexion raccordées | Parité d’objectif. Tester la révocation et les parcours par rôle à chaque étape. | P0 |
| Accès | Sélection de service et profil associé | Appartenances et permissions par organisation | Sélection d’espace et accès direct gardé | Choisir la correspondance entre profils historiques et droits explicites. | P0 |
| Accès | Demande de récupération | Aucun endpoint relevé | Aucun écran relevé | Concevoir une récupération vérifiable après arbitrage fournisseur, sans transporter les anciens mots de passe. | P1 |
| Organisations | Liste et fiche de service | Annuaire et fiche publics | Liste et fiche publiques | Valider les champs visibles et la correspondance code/statut. | P0 |
| Organisations | Profil du service dans l’espace | Détail et modification autorisée, registre global | Profil local et gestion globale | Comparer les champs utiles, notamment visuels et liens sociaux, avant toute extension des DTO. | P1 |
| Membres | Liste et fiche dans un service | Port, cas d’usage et mémoire | Absent | Persistance, lecture HTTP sous périmètre et écrans. | P1 |
| Membres | Gestion et profil utilisateur | Création métier en mémoire, identité et accès séparés | Absent | Définir les opérations réellement requises et le rattachement explicite, puis raccorder les écritures. | P1 |
| Profils | Consultation de profils et navigation conditionnelle | Grants et politiques existants | Menus filtrés | Pas de parcours de consultation ou d’administration des affectations. Définir qui peut les gérer. | P1 |
| Demandes | Dépôt et revue administrative | Dépôt, liste, détail, décision globalement protégés | Absent | Clarifier l’acteur du dépôt et les effets de la décision, puis raccorder l’interface. | P1 |
| Demandes | Écran `MesDemandes` partiel | Aucun parcours personnel relevé | Absent | Confirmer l’usage avant de le planifier. | P3 |
| Invitations | Liste du membre et du service | Absent | Absent | Dépend du contrat d’identité et du cycle de vie de l’appartenance. | P2 |
| Cotisations | Paramètres et catégories par service | Absent | Absent | Modéliser les paramètres et l’appartenance aux catégories sur données synthétiques. | P2 |
| Cotisations | Montants annuels et lectures par membre | Absent | Absent | Établir le périmètre des opérations réellement utilisées et vérifier les calculs de référence. | P2 |
| Statistiques | Compteurs et sélecteur du tableau de bord | Pas d’agrégats dédiés relevés | Accueil global et profil local | Calculer les compteurs après confirmation des périmètres et sources. | P2 |
| Événements | Lectures et comptage par service | Absent | Absent | Confirmer les écrans et opérations utilisés avant de spécifier une parité. | P3 |
| Aide et médias | Guide, WhatsApp, documents, tutoriels, images | Pas de module dédié relevé | Affichage de données d’organisation | Confirmer la portée du support documentaire et du stockage média. | P3 |

## 5. Ordre de développement et réception

| Étape | Réalisation et justification | Critères de validation |
| --- | --- | --- |
| 1 · Accès et contrats | Stabiliser les parcours déjà câblés et décider des liens entre identité, appartenance et membre. Définir la correspondance des profils Flutter, sans importer de secrets. Préparer des fixtures multi-organisations. Cette étape fixe le périmètre des opérations suivantes. | Connexion et déconnexion, session révoquée, restauration de destination interne sûre, admin global, admin local, membre actif ou inactif et refus inter-organisations. Pas de données privées dans le cache partagé. |
| 2 · Membres et organisation | Partir des ports et cas d’usage Membre, livrer la persistance et les lectures autorisées, puis la liste et la fiche. Ajouter les écritures confirmées après validation de la relation avec l’appartenance. Préserver l’annuaire et le CRUD existants. | Tests repository et HTTP sur fixtures, filtres et pagination stables, lecture dans le bon périmètre, refus d’accès croisé et d’élévation, validations de domaine et concurrence des créations. Vérifier la liste et la fiche dans Next.js. |
| 3 · Demandes, invitations et cycle des accès | Raccorder la revue des demandes au contrat actuel. Arbitrer séparément tout dépôt public et toute création d’accès à la suite d’une décision. Ajouter les invitations ou la récupération lorsque leur modèle d’identité et leurs règles sont validés. | Tests de bout en bout pour les transitions et acteurs autorisés, effets explicitement vérifiés, rejouabilité, unicité des rattachements, contrôle d’expiration et aucun secret divulgué. |
| 4 · Cotisations et statistiques | Livrer paramètres, catégories, affectations et montants par année après le registre membre. Ajouter les lectures de cotisation puis calculer les agrégats à partir de sources métier vérifiées. | Exemples de référence pour changement d’année, catégories manquantes, montants et compteurs. Autorisations par organisation, exactitude des résultats et cohérence des éventuelles écritures. |
| 5 · Ergonomie et compléments observés | Travailler les états vides, erreurs, navigation et lisibilité une fois les parcours validés. Prioriser événements, guide et contenus après confirmation de leur usage. Reporter la conception d’extensions hors parité à une décision ultérieure. | Validation utilisateur sur les parcours complets, contrôles d’accessibilité, cohérence des erreurs et absence de régression sur les contrats et la sécurité. |

Chaque tranche conserve les cas d’usage indépendants de Firebase et de SQL, maintient les adaptateurs dans Fastify et fait transiter les données Next.js par Fastify. Les modifications de contrat doivent être motivées et couvertes par des tests. Pour la validation dynamique, utiliser des fixtures synthétiques et les émulateurs isolés selon les autorisations applicables. Flutter et ses données continuent à fonctionner selon leur configuration existante. Un éventuel rapprochement des collections historiques nécessite une décision indépendante.

## 6. Arbitrages avant réalisation

1. Quels profils Flutter correspondent à quels droits de la plateforme ? Confirmer les rôles effectivement utilisés, leurs scopes et la délégation des affectations. Aucun rôle de commission n’est à déduire d’un nom de modèle ou de collection.
2. Quel lien métier doit unir la fiche membre et l’identité ? Décider si un membre peut exister sans accès, comment il est rattaché à plusieurs organisations et quels identifiants historiques doivent rester visibles.
3. Quels acteurs peuvent déposer une demande, et qu’autorise sa validation ? Trancher entre décision simple et provisionnement distinct. Valider le vocabulaire « demande plateforme » et « appartenance » avant toute interface publique.
4. Quel parcours de récupération et d’invitation est attendu ? Définir le canal, la durée, la preuve de contrôle de l’adresse et les responsabilités de l’émetteur sans reprendre le traitement historique des mots de passe.
5. Quelles structures Flutter sont la référence pour les membres, les paramètres et les cotisations ? Utiliser des schémas ou exemples synthétiques validés par le métier. Décider quels compteurs, liens, médias et champs d’organisation sont nécessaires à la parité.
6. Quels parcours partiels sont réellement utilisés et doivent devenir des critères de parité ? Faire confirmer `MesDemandes`, les opérations sur événements et le périmètre exact des cotisations avant leur mise au planning.

Statuts historiques inchangés pour cet audit. FT-01/E1 **BLOCKED**, P3 **BLOCKED**, L1-C.3 **FAIL**, production **NON AUTORISÉE**. Rapport soumis à validation humaine avant réalisation.
