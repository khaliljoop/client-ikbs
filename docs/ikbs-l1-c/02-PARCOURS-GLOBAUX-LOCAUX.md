# L1-C.2 — Parcours d’administration globale et locale

## Résultat

Les espaces Next.js utilisent les capacités de la session IKBS. Le frontend utilise ces informations pour le rendu et la navigation. Fastify reste seul responsable des décisions d’accès et vérifie les requêtes d’organisation, y compris celles émises depuis un écran déjà ouvert.

| Parcours | Comportement |
|---|---|
| `/dash`, `/dash/organisations` | Session vérifiée côté serveur avant le rendu. `organizations.global.manage` affiche l’administration et son CRUD existant. Sans ce droit, un écran de refus remplace le contenu et la liste privée n’est pas demandée. |
| `/espace/[organizationCode]` | Résolution du code dans les organisations remises par Fastify. Un espace visible exige `organization.read`. La fiche appelle `GET /organizations/:id` avec l’identifiant de cette appartenance. `organization.profile.update` ouvre le formulaire partagé, puis `PATCH /organizations/:id` vérifie à nouveau l’action côté API. |
| `/espaces` | Sélecteur protégé par session. Affiche le lien global et les seules organisations accessibles. Présente un état explicite à un compte connecté sans parcours disponible. Accessible depuis le menu de session. |
| Après connexion | Priorité au retour interne autorisé, puis au parcours global disponible, à l’organisation unique ou au sélecteur. Une destination externe, inconnue ou privée hors périmètre déclenche le repli. |

Les menus n’affichent que les écrans présents. La permission de revue des demandes ne donne pas accès à l’administration des organisations. Les écrans de demandes, membres, cotisations et autres modules absents ne sont pas créés. Un administrateur global ne reçoit pas un espace local par son seul droit de plateforme. Une appartenance suspendue ou révoquée disparaît dès que ses capacités ne sont plus renvoyées par Fastify.

## Fichiers et intégration

- `src/lib/auth/workspaces.ts` sélectionne les parcours et les appartenances visibles à partir du DTO. `src/lib/auth/redirect.ts` inclut `/espaces` dans les retours internes. La page `/login` utilise le profil de la réponse de connexion.
- `src/components/auth/WorkspaceAccess.tsx`, `WorkspaceSelection.tsx`, `SessionProvider.tsx` et `SessionUserMenu.tsx` assurent le rendu par capacité, le sélecteur, la réévaluation et le menu de session. Les layouts existants de `/dash` et `/espace` conservent les shells et ajoutent le contrôle de rendu dans la session. La page d’accueil d’administration ouvre le CRUD existant.
- `src/features/organizations/components/OrganizationWorkspace.tsx` raccorde la fiche de profil à la route locale existante. Le formulaire réutilise `FormModal`, `DynamicForm` et `organization-form.ts`. `FormModal.tsx` accepte un message d’échec de soumission facultatif. `OrganizationManagement.tsx` conserve le CRUD et utilise les messages typés d’erreur.
- `src/config/admin-menu.ts`, `src/config/organization-menu.ts`, les sidebars et `OrganizationShell.tsx` utilisent les capacités disponibles et le nom d’organisation de la session. `src/app/(public)/espaces/page.tsx` et `next.config.ts` ajoutent le sélecteur et sa politique `private, no-store`.
- `src/lib/api/client.ts` demande un rechargement du profil après certains refus des routes privées d’organisations. `src/lib/api/organizations.ts` transmet l’identifiant encodé et un signal d’annulation pour la lecture locale. Les requêtes métier continuent à passer par le routage relatif L1-C.1.
- `tests/auth.test.mjs` et `tests/auth-browser.test.mjs` couvrent la sélection et les principaux parcours, avec des profils synthétiques.

## Session et gestion des refus

Le SSR conserve l’appel `/auth/me` propre à la requête et sans cache, avec uniquement le cookie de session. Les pages ne sérialisent aucun enregistrement d’organisation privé dans leurs props. La liste et la fiche privées sont chargées côté client après le contrôle de rendu. Le provider relit le profil lors d’un changement de chemin dans un layout réutilisé, au retour au premier plan et après un refus métier 403/404, en plus des vérifications L1-C.1. Un changement d’identité réinitialise le sous-arbre privé. Quand un droit disparaît, les données et actions de l’écran concerné sont démontées. Aucun état d’organisation active, cookie ou jeton n’est stocké par JavaScript.

Un 401 remet l’utilisateur sur la connexion avec un retour interne. Un 403 conserve la session et affiche le refus. Un 404 du backend présente une fiche indisponible. Un 503 reste distinct d’un refus d’accès et autorise un nouvel essai. Une navigation directe hors périmètre rend l’état de refus de l’interface avant tout accès à la fiche. Cet état d’interface ne prétend pas reproduire le statut HTTP métier de Fastify.

## Vérifications

| Vérification | Résultat |
|---|---|
| `node --test tests/auth.test.mjs` | 8 tests réussis. Contrats HTTP, cookies et cache, retour interne, sélecteur, permission globale et appartenance locale. |
| `IKBS_TEST_CHROME="/chemin/vers/Chrome" node --test tests/auth-browser.test.mjs` | 1 scénario intégratif réussi en HTTPS sur Chrome headless avec backend simulé. |
| `./node_modules/.bin/tsc --noEmit --incremental false` | Réussi. |
| `NEXT_TELEMETRY_DISABLED=1 npm run build -- --webpack` | Réussi. L’administration, les espaces locaux et le sélecteur sont dynamiques. |
| `git diff --check` | Réussi. |
| `npm run lint` | 3 erreurs préexistantes, 14 avertissements. Aucune nouvelle erreur. |

Le scénario navigateur vérifie le parcours global, le CRUD via les requêtes de recette, l’administration locale et la soumission de son formulaire, le refus 403 de cette soumission, le choix d’une organisation parmi deux, la lecture sans édition, le compte sans espace et la navigation directe interdite sans lecture de fiche. Il vérifie aussi la disparition d’une fiche après retrait d’appartenance, le maintien d’un autre espace, les réponses 401, 404 et 503, la déconnexion depuis l’espace privé, la redirection après connexion et deux profils SSR simultanés sans mélange. L’essai initial a exposé un clic du test avant l’hydratation du menu. L’attente du contrôle interactif a corrigé le scénario sans modifier les règles de l’application.

### Erreurs de lint résiduelles

| Fichier | Règle | Constats |
|---|---|---|
| `src/app/(public)/data-table-demo/page.tsx`, ligne 352 | `react/no-unescaped-entities` | Apostrophe JSX non échappée dans la démonstration. |
| `src/app/(public)/organisations/page.tsx`, ligne 103 | `react-hooks/set-state-in-effect` | L’effet existant déclenche un chargement avec mise à jour synchrone d’état. |
| `src/features/organizations/components/OrganizationManagement.tsx`, ligne 501 | `react-hooks/set-state-in-effect` | Même signal sur le chargement existant du CRUD. |

## Préconditions de L1-C.3

- Autorisation explicite pour démarrer la recette intégrée.
- Backend Fastify de recette isolé et comptes synthétiques avec profils globaux, locaux et suspendus. Qualification de Firebase Auth toujours ouverte. Le scénario Chrome vérifie la compatibilité du frontend avec le contrat simulé.
- Vérifier le frontal HTTPS et la transmission des cookies, la réévaluation des capacités après une suspension réelle et le parcours intégral de gestion sur le backend de recette. Valider le comportement de révocation hors bande Firebase selon les arbitrages L1-B.
- Aucun changement du backend, de Flutter ni des données de production pour ce lot. Aucun déploiement ni compte réel.
