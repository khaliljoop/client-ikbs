# IKBS — F01.3-F · Habilitations natives des administrateurs d’organisation

- **Politique RBAC · PASS**
- **Tests automatisés · PASS**
- **Recette Chrome · FAIL**
- **Nettoyage des données de recette · VERIFIED**

## Politique

Auparavant, `roles.manage` et `roles.assign` exigeaient un octroi direct pour un `ORGANIZATION_ADMIN`. Fastify les calcule désormais comme permissions natives de chaque appartenance active avec ce rôle. Le calcul est limité à l’organisation et s’applique à `/auth/me` ainsi qu’aux décisions des routes métier. La désactivation, le remplacement du rôle intégré ou le retrait de l’appartenance prend effet au contrôle suivant, y compris avec la même session.

Les permissions directes stockées restent inchangées. `MEMBER` ne reçoit aucun de ces deux droits par défaut et `SUPER_ADMIN` conserve ses permissions globales historiques. Le catalogue des permissions délégables reste identique. Les routes continuent de vérifier les droits détenus, la session, le CSRF et l’organisation. L’auto-attribution, les rôles intégrés, les permissions globales et les permissions d’administration dans une définition personnalisée restent protégés.

## Fichiers modifiés

- **API_IKBS** · `src/modules/authorization/domain/policy.ts` et les tests HTTP `authorization`, `organization-role`, `role-assignment`, `membership-directory`.
- **client-ikbs** · `src/lib/auth/workspaces.ts`, `src/components/layout/OrganizationSidebar.tsx`, `tests/auth.test.mjs` et ce rapport. Le filtre de navigation continue de lire les capacités renvoyées par Fastify.

## Vérifications automatisées

- Backend mémoire ciblé · **11 tests sur 5 fichiers** réussis, couvrant l’administrateur actif sans octrois directs, le membre ordinaire, l’administrateur inactif, la révocation avec la même session, l’isolation, les rôles et les affectations.
- Backend Firestore Emulator jetable · **231 tests sur 47 fichiers** réussis, dont les régressions Membres, rôles personnalisés, affectations et permissions directes. L’émulateur de test a été arrêté après la suite.
- Frontend · **13 tests** réussis, dont la visibilité du menu selon les capacités de l’organisation sélectionnée et les erreurs API. TypeScript, lint ciblé et build Next.js Webpack réussis.
- TypeScript backend, TypeScript des tests et ESLint backend ciblé réussis.

## Chrome et état local

Le préflight a confirmé Firestore Emulator `127.0.0.1:18081`, Auth Emulator `127.0.0.1:19099`, le projet `demo-ikbs-l1a`, Fastify local et Next.js sur `http://localhost:3000`. L’état initial de D1000001 correspondait à la référence R1.

Fastify a renvoyé pour `demo.admin` dans D1000001 les permissions effectives `organization.read`, `organization.profile.update`, `members.write`, `roles.manage` et `roles.assign`. Les permissions globales étaient vides. La connexion, l’affichage du menu, l’accès au formulaire de création, le catalogue et la création du rôle synthétique ont été vérifiés dans Chrome.

Chrome a également confirmé la recherche et la sélection de `demo.membre1`, l’attribution et la présence du rôle après actualisation, le refus d’auto-attribution (403), le refus de suppression d’un rôle utilisé (409 `ORG_ROLE_IN_USE`), le retrait de l’affectation et la suppression de la définition. La liste Membres restait accessible et l’écran a été vérifié à 390 px.

L’édition complète en interface reste en échec de recette. Après ouverture du formulaire et saisie du nouveau nom, la sonde Chrome n’a pas constaté la nouvelle valeur dans le champ. La sauvegarde du nom et de la description via le bouton et leur persistance après rechargement n’ont donc pas été validées. La cause de cette anomalie n’a pas été isolée. Aucun PATCH manuel n’a servi à valider l’édition et le formulaire n’a pas été modifié.

La relecture finale de Firestore Emulator a confirmé l’égalité avec la référence pour les identités, les appartenances, les octrois directs, les rôles et les affectations. Aucun octroi direct n’a été ajouté à `demo.admin`. La définition et l’affectation synthétiques ont disparu. Aucun changement de données ni migration n’était nécessaire pour appliquer la politique native.
