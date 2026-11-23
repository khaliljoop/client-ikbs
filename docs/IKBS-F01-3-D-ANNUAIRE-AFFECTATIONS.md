# IKBS — F01.3-D · Annuaire et affectations

## API et interface

| Endpoint Fastify | Fonction |
| --- | --- |
| `GET /api/v1/organizations/:id/memberships?page=1&limit=15&search=…` | Annuaire paginé. Chaque entrée contient uniquement `identityId` et `displayName`. La recherche porte sur ces deux valeurs. |
| `GET /api/v1/organizations/:id/assignable-roles` | Identifiant et nom des rôles que l’acteur peut déléguer. |

Les deux lectures exigent `roles.assign` dans l’organisation concernée et réutilisent le RBAC existant. L’annuaire retient les appartenances actives dont l’identité est utilisable. Le sélecteur n’utilise pas les fiches Membres. L’adaptateur Firestore projette le champ des appartenances des grants existants, puis lit les identités des seuls grants correspondants. La recherche et la pagination ont lieu côté serveur. Le coût de lecture augmente avec la collection des grants en l’absence d’un index d’appartenances par organisation.

Dans **Administration → Rôles et habilitations**, le panneau **Affectations** permet de rechercher et sélectionner une appartenance, de consulter ses rôles, d’en attribuer un ou de le retirer après confirmation. Il réutilise les trois routes F01.3-B et actualise les données après une opération. L’interface ne propose pas l’auto-attribution, et Fastify vérifie de nouveau chaque mutation. Un compte doté de `roles.assign` peut utiliser le sélecteur sans disposer de `roles.manage`.

## Tests exécutés

- **231 tests backend sur 47 fichiers** ont réussi sur Firestore Emulator jetable, projet fictif `demo-ikbs-l1a`, en boucle locale. La suite couvre recherche, pagination, projection exacte, appartenance inactive ou identité désactivée, refus 401/403/404, isolation, rôles attribuables, attribution, retrait, auto-attribution, révocation et non-régression Membres.
- Le scénario annuaire en mémoire et les **12 tests frontend** ont réussi. TypeScript backend et frontend, TypeScript des tests backend, ESLint ciblé et le build Next.js Webpack ont réussi.
- **Chrome avec `demo.admin` et ses droits initiaux** a confirmé les 403 de l’annuaire et des affectations, le masquage du menu, le refus de l’accès direct et inter-organisations, la redirection anonyme et la disponibilité de la liste et d’une fiche Membres. L’écran de refus a été vérifié à 390 px. L’écran privilégié reste à vérifier dans Chrome.

## Recette privilégiée · BLOCKED

État initial capturé en lecture seule sur Firebase Emulator `demo-ikbs-l1a`. Dans **IKBS Démonstration (D1000001)**, `demo.admin` est un `ORGANIZATION_ADMIN` actif avec `permissions: []` et sans octroi global. La cible `demo.membre1` est un `MEMBER` actif avec `organization.read`.

L’autorisation demandée porte sur l’ajout temporaire de `roles.manage` et `roles.assign` à la seule appartenance de `demo.admin`. Le scénario préparé crée un rôle synthétique de recette, vérifie le refus d’auto-attribution, sélectionne `demo.membre1`, attribue puis retire le rôle, contrôle les permissions renvoyées par Fastify et supprime le rôle synthétique. Il prévoit de restaurer les octrois initiaux de l’administrateur et de les relire.

Autorisation explicite en attente à la livraison. **Aucun octroi temporaire, aucune affectation ou définition de recette n’a été ajouté à l’émulateur de démonstration.**
