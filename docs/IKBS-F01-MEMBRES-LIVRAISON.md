# IKBS — F01 · Livraison Membres

## Fonctionnalités réalisées

- Le menu **Membres** ouvre la [liste d’IKBS Démonstration](http://localhost:3000/espace/D1000001/membres). Le tableau présente le nom, le code et le statut, avec recherche, pagination et états de chargement, vide et erreur. Chaque nom ouvre sa fiche.
- Fastify expose `GET /api/v1/organizations/:id/members` et `GET /api/v1/organizations/:id/members/:memberId`. Les cas d’usage existants lisent un repository limité à l’organisation résolue par la politique d’autorisation. Firestore stocke les fiches dans `service/{organizationId}/members/{memberId}`. La politique exige une appartenance active, une organisation active et `organization.read`. Un droit local insuffisant retourne 403. Les organisations ou fiches étrangères sont masquées par un 404.
- Les réponses privées utilisent `no-store`. Seuls l’identifiant de la fiche, le code, le nom, le prénom et le statut sont transmis. La recherche couvre les noms et codes. Les coordonnées, les identifiants de connexion et les autres champs personnels restent côté serveur.
- Le seed existant ajoute trois fiches synthétiques dans `D1000001` après vérification de Firestore Emulator, du projet `demo-ikbs-l1a` et du backend local. Il utilise des identifiants stables, contrôle les collisions et crée les fiches manquantes dans une transaction. Ces fiches métier sont indépendantes des comptes et de leurs droits.

## Fichiers modifiés

- API_IKBS · `src/app/app.ts`, `src/modules/authorization/presentation/business-access.ts`, `src/scripts/seed-dev.ts`.
- API_IKBS · Sous `src/modules/members/` · `domain/repositories/member-page.ts`, `infrastructure/firebase/member.mapper.ts`, `infrastructure/repositories/{firebase,in-memory}-member.repository.ts`, `presentation/member.routes.ts`.
- API_IKBS · `tests/helpers/authorized-app.ts`, `tests/integration/members/directory.http.test.ts`.
- client-ikbs · `src/config/organization-menu.ts`, `src/lib/api/members.ts`, `src/features/members/components/MemberDirectory.tsx`, pages `membres/page.tsx` et `membres/[memberId]/page.tsx` sous l’espace organisation, et ce rapport.

## Commandes et résultats

| Commande ou contrôle | Résultat réel |
| --- | --- |
| Backend · `npm run typecheck` et `npm run typecheck:test` | Réussis. |
| Backend · `IKBS_F01_FIRESTORE_TEST=1 npm test` avec `NODE_ENV=test`, `FIREBASE_PROJECT_ID=demo-ikbs-l1a` et `FIRESTORE_EMULATOR_HOST=127.0.0.1:18082` | **226 tests sur 44 fichiers réussis**. Instance jetable démarrée sans import ni identifiants et arrêtée après la suite. Le test F01 vérifie liste, fiche, recherche, pagination, organisation vide ou inconnue, validation 400, accès anonyme 401, droit insuffisant 403, refus inter-organisations 404 et projection des champs. |
| Backend · `vitest run tests/integration/members/directory.http.test.ts` | 1 test réussi avec le repository mémoire. |
| Backend · `npm run seed:dev`, deux exécutions | Première exécution : 3 créés. Seconde : 0 créé, 3 déjà présents. Les trois organisations existantes ont été reconnues. |
| Frontend · `./node_modules/.bin/tsc --noEmit --incremental false` et ESLint ciblé | Réussis. |
| Frontend · `npm run build -- --webpack` | Réussi. La liste et la fiche sont des routes dynamiques. Le build Turbopack initial est resté bloqué en compilation et a été arrêté avant la relance. |
| Frontend · `node --test tests/auth.test.mjs` | 8 tests réussis. |
| Chrome jetable · frontend local sur `http://localhost:3000` | Requête anonyme 401, connexion `demo.admin` 200 via le relais Next.js, entrée Membres visible, trois fiches affichées, recherche Moussa, ouverture de la fiche Awa, pagination API `page=2&limit=1` avec HTTP 200, un résultat sur la page et trois au total. |

## Limites

- La première sélection de tests sans émulateur a déclenché 16 échecs et l’échec d’initialisation d’une autre suite Firestore. Les suites concernées ont ensuite réussi lors de l’exécution complète sur l’émulateur jetable.
- Le lint global frontend signale trois erreurs préexistantes dans `data-table-demo/page.tsx:352`, `organisations/page.tsx:103` et `OrganizationManagement.tsx:501`. Les fichiers F01 passent le lint ciblé.
- Le repository filtre et pagine les résultats après lecture de la sous-collection de l’organisation. Le coût de lecture augmente avec la taille de cette sous-collection.
