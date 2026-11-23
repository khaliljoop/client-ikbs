# IKBS — F01.2-A · Création et modification des membres

## Fonctionnalités livrées

- **Ajouter un membre** depuis la liste et **Modifier** depuis la fiche. Le formulaire réutilise les composants IKBS, valide les champs et affiche les erreurs et notifications. La création ouvre la nouvelle fiche. La modification actualise la fiche et le retour à la liste affiche le nouveau nom.
- Fastify expose `POST /api/v1/organizations/:id/members` et `PATCH /api/v1/organizations/:id/members/:memberId`. La permission locale `members.write` est accordée par défaut à l’administrateur de l’organisation. Fastify revérifie la session, l’appartenance et la permission dans l’unité de travail existante, avec le contrôle CSRF habituel.
- La création requiert prénom, nom, email et nom d’utilisateur. La modification porte sur le prénom et le nom. Le code `MBR-${année}-${séquence}` est attribué par le serveur et reste fixe. L’email et le nom d’utilisateur restent hors des réponses du module. Aucune identité de connexion ni appartenance n’est créée par ces opérations.
- Le compteur annuel Firestore et la création sont enregistrés dans la même transaction. L’email et le nom d’utilisateur sont vérifiés dans le périmètre de l’organisation. Les écritures réutilisent les adaptateurs F01.

## Fichiers modifiés

- **API_IKBS** · `src/app/app.ts`, politique et stockage sous `src/modules/authorization/`, routes sous `src/modules/authorization/presentation/`, cas d’usage `create-member.ts` et `update-member.ts`, entité `member.ts`, interface `member-code-generator.ts`, générateur `firebase-member-code-generator.ts`, routes `member.routes.ts`.
- **Tests API_IKBS** · `tests/helpers/authorized-app.ts`, `tests/integration/authorization/authorization.http.test.ts`, `tests/integration/members/directory.http.test.ts`.
- **client-ikbs** · `src/lib/api/members.ts`, `src/features/members/components/MemberDirectory.tsx`, `src/features/members/components/MemberForm.tsx` et ce rapport.

## Vérifications effectuées

| Contrôle | Résultat |
| --- | --- |
| Backend avec Firestore Emulator jetable, `demo-ikbs-l1a`, `127.0.0.1:18082` | **227 tests réussis sur 44 fichiers**. Création et modification persistées, champs obligatoires, code imposé par le serveur, doublons et concurrence, refus 401/403/404, isolation des organisations, vérification des collections d’identités et d’autorisations, non-régression F01. |
| Backend mémoire · `vitest run tests/integration/members/directory.http.test.ts` | Deux tests réussis. |
| Frontend · `node --test tests/auth.test.mjs` | Huit tests réussis. |
| TypeScript backend, TypeScript tests backend, TypeScript frontend et ESLint ciblé | Réussis. |
| Chrome jetable · `demo.admin` | Création dans D1000001, navigation automatique vers la fiche `MBR-2026-000001`, formulaire de modification prérempli, nouveau nom visible sur la fiche puis dans la liste. La fiche synthétique « Mariama Démo F01.2-A modifiée » est conservée dans l’émulateur local. |

## Blocages

Aucun blocage fonctionnel sur le parcours testé. La première suite Firestore a dépassé le délai de cinq secondes pendant les reprises transactionnelles. La relance avec un délai adapté au scénario concurrent a vérifié les mêmes assertions. La première sonde Chrome n’a pas détecté l’ouverture du formulaire. Le parcours a réussi après attente du chargement.
