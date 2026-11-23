# IKBS — F01.3-C · Interface de gestion des rôles et habilitations

## Écran livré

Dans l’espace organisation, **Administration → Rôles et habilitations** ouvre `/espace/[organizationCode]/roles`. Le menu tient compte des permissions de la session pour cet espace. Avec `roles.manage`, la page liste les définitions personnalisées, affiche leurs permissions, permet la création et la modification, puis demande confirmation avant suppression. Le code reste fixe après création. La suppression refusée pour un rôle encore attribué affiche un message dédié. Le tableau se recharge après une mutation réussie.

Le formulaire regroupe les permissions délégables sous « Organisation » et « Membres ». Fastify fournit la liste. Quand une définition comporte une permission que le gestionnaire ne détient pas, il peut toujours modifier son nom et sa description. Les permissions affichées sont celles de la définition.

## API et permissions

| Appel Fastify | Usage |
| --- | --- |
| `GET /api/v1/organizations/:id/roles` | Tableau et consultation des permissions de chaque rôle |
| `POST /api/v1/organizations/:id/roles` | Création |
| `PATCH /api/v1/organizations/:id/roles/:roleId` | Modification |
| `DELETE /api/v1/organizations/:id/roles/:roleId` | Suppression |
| `GET /api/v1/organizations/:id/role-permissions` | Intersection du catalogue local personnalisable et des permissions délégables de l’acteur |

Ces appels utilisent `roles.manage`, la session, le périmètre et les protections CSRF existants. La dernière route est le seul ajout backend. Elle réutilise la décision déjà utilisée pour valider les mutations et conserve la politique RBAC. Les erreurs 401, 403, 404 et 409 ont un traitement dans le client.

## Blocages et dépendances

- **Affectations.** Les routes existantes exigent `roles.assign` et un `identityId` connu. Aucun endpoint d’annuaire des appartenances actives n’a été trouvé. Les fiches Membres sont des fiches métier. La page signale l’indisponibilité du sélecteur aux détenteurs de la permission, sans proposer d’action fictive. Une mission distincte pourra ajouter une liste paginée des appartenances actives, sous `roles.assign`, limitée à l’identité et à un libellé d’affichage utile.
- **Permissions effectives d’un tiers.** `/auth/me` décrit la session courante. Aucune lecture autorisée des droits effectifs d’un autre utilisateur n’a été relevée. Le tableau s’en tient aux permissions de la définition.
- **Recette privilégiée bloquée.** Les quatre comptes synthétiques connus ont été contrôlés en lecture seule. Aucun ne détient `roles.manage` ou `roles.assign`. Les octrois ont été conservés. Si un test Chrome privilégié est autorisé ultérieurement, vérifier d’abord un compte synthétique existant, son organisation et ses octrois, puis accorder explicitement `roles.manage` pour la seule fenêtre de test sur Firebase Emulator. Capturer et restaurer l’état initial. `roles.assign` relève d’une autorisation séparée après raccordement de l’annuaire.

## Vérifications

- `node --test tests/auth.test.mjs tests/roles.test.mjs` · 10 tests réussis, dont le câblage des routes, le contrôle CSRF côté client, les états 401/403/404/409 et le message de conflit pour un rôle attribué.
- TypeScript frontend et lint ciblé des composants et services de la livraison réussis.
- Build Next.js Webpack réussi. La route Rôles et habilitations est dynamique.
- **230 tests backend sur 46 fichiers** réussis sur Firestore Emulator jetable, avec le projet fictif `demo-ikbs-l1a` en boucle locale. La suite couvre le CRUD, le refus de suppression d’un rôle attribué, la délégation filtrée, l’isolation et les régressions Membres. TypeScript et lint backend ciblé réussis.
- **Chrome avec `demo.admin`**, octrois inchangés. Fastify a répondu 403 pour les rôles, le catalogue et les affectations. Le menu était masqué, l’accès direct sans droit et l’accès à une autre organisation affichaient un refus. La liste et une fiche Membres restaient accessibles. Après déconnexion, l’accès direct redirigeait vers la connexion. La recette positive du CRUD dans Chrome reste bloquée par les octrois disponibles.
