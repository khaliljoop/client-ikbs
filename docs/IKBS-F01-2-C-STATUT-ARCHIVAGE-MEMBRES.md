# IKBS — F01.2-C · Statut et archivage des membres

## Transitions et interface

| État de départ | Opérations |
| --- | --- |
| Actif | Désactiver ou archiver |
| Inactif | Réactiver ou archiver |
| Suspendu | Activer ou archiver |
| Archivé | Consulter avec habilitation. État final. |

Flutter conserve un indicateur numérique `metat` initialisé à l’inscription, sans transition d’archivage constatée dans les parcours examinés. Fastify conserve les trois valeurs existantes et ajoute `ARCHIVED`. Le statut suspendu reste lisible et activable. La mise en suspension ne fait pas partie des opérations HTTP de cette livraison.

- La liste et la fiche affichent les actions autorisées. Désactivation et archivage exigent une confirmation. Les notifications et l’actualisation suivent chaque mutation. Le filtre « Afficher les archives » est réservé aux personnes habilitées.
- `PATCH /api/v1/organizations/:id/members/:memberId/status` vérifie le statut attendu dans la transaction. Une transition invalide ou le changement concurrent du statut produit un 409. L’écriture Firestore ne change que le statut et la date de mise à jour.
- `members.lifecycle` est une permission locale explicite pour les transitions et la consultation des archives. Aucun rôle ne la reçoit par défaut. `members.write` garde son périmètre. L’archivage exclut la fiche du registre courant, préserve son identifiant et son contenu et ne modifie ni les comptes ni les accès.

## Vérifications

- **228 tests backend sur 44 fichiers** dans un Firestore Emulator jetable, projet `demo-ikbs-l1a`. Couverture de l’activation, de la désactivation, de la réactivation, des archives et de la conservation des données, des conflits concurrents, des organisations inactives, de l’isolation, des refus et de la non-régression F01.2-A/B.
- Trois tests HTTP ciblés en mémoire et huit tests frontend de session réussis. TypeScript backend, TypeScript des tests, TypeScript frontend et lint ciblé réussis.
- **Chrome avec `demo.admin`** dans D1000001. Annulation de la confirmation, désactivation, réactivation, archivage et présence de la fiche dans le filtre d’archives après disparition du registre courant. La fiche synthétique `MBR-2026-000002` est conservée. L’habilitation temporaire du compte a été retirée après le test.

## Limites

La restauration d’une fiche archivée reste hors périmètre. Les actions et le filtre sont visibles uniquement après octroi explicite de `members.lifecycle`. Les premières tentatives de recette Chrome ont rencontré un délai de verrou Firestore et un sélecteur périmé dans la sonde. La relance sur la fiche synthétique existante a réussi sans redémarrage de l’émulateur de démonstration.
