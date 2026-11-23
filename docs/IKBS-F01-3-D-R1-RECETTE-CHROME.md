# IKBS — F01.3-D-R1 · Recette Chrome privilégiée

**Verdict fonctionnel · BLOCKED**

## Préflight et état initial

Le préflight en lecture seule a confirmé le projet fictif `demo-ikbs-l1a`, Firestore Emulator sur `127.0.0.1:18081`, Auth Emulator sur `127.0.0.1:19099`, le Fastify local et la disponibilité de Next.js sur `http://localhost:3000`. La configuration de relais est locale et la réponse publique de D1000001 concorde entre le relais Next.js et Fastify. La configuration Docker contrôlée ne présentait pas d’identifiants Firebase réels.

La relecture Firestore a confirmé IKBS Démonstration (D1000001) active et les deux identités synthétiques attendues. Une référence locale protégée contient les identités synthétiques, les appartenances, les octrois directs et les rôles. Elle ne contient aucun mot de passe, jeton ou secret.

| Compte | Appartenance | Octrois directs | Rôles personnalisés |
| --- | --- | --- | --- |
| `demo.admin` | `ORGANIZATION_ADMIN` active | Aucun | Aucun |
| `demo.membre1` | `MEMBER` active | `organization.read` | Aucun |

Les deux comptes étaient sans octroi global. Aucune définition de rôle personnalisé n’existait dans D1000001.

## Vérifications

- Vitest ciblé en mémoire · **11 tests réussis sur 5 fichiers**, couvrant définitions, affectations, annuaire, autorisations et registre Membres.
- `node --test tests/auth.test.mjs tests/roles.test.mjs` · **12 tests réussis**.

- **Chrome avec les octrois initiaux de `demo.admin`** · réponses Fastify 403 pour l’annuaire, la gestion des rôles et les affectations. L’entrée de menu était masquée, l’accès direct et l’accès inter-organisations étaient refusés, et l’écran de refus a été vérifié à 390 px. La liste et une fiche Membres restaient accessibles. Après déconnexion, l’accès direct redirigeait vers la connexion.

## Blocage et restauration

Le contrôle automatique a refusé de lancer le scénario privilégié. Il a considéré que l’autorisation contenue dans la pièce jointe ne constituait pas une approbation explicite fiable de la modification d’octrois RBAC. Une confirmation directe dans le chat a été demandée.

**État de restauration · aucune mutation RBAC exécutée.** Aucun octroi temporaire n’a été appliqué, et aucune définition ni affectation synthétique de recette n’a été créée. La procédure de nettoyage préparée n’a pas été déclenchée. Les comparaisons après une mutation et la vérification en Chrome de la révocation restent à exécuter après autorisation reconnue.
