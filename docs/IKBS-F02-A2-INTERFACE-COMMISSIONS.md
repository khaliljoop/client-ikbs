# IKBS — F02-A2 · Interface privée des commissions

## Pages et services

- `/espace/[organizationCode]/commissions` présente le registre privé. `CommissionWorkspace` raccorde la liste, le détail en panneau, la confirmation d’archivage et les notifications. `CommissionForm` utilise les champs et le popup existants.
- `src/lib/api/commissions.ts` définit les DTO F02-A1 et les cinq appels de liste, détail, création, modification et archivage. Le client API commun conserve les cookies de même origine, le CSRF et `no-store`. Les appels emploient l’UUID de l’organisation trouvé dans les capacités de la session, à partir du code de l’espace.
- Le menu et l’accès direct exigent `commissions.read`. Créer, modifier et archiver exigent également `commissions.manage`. La décision se fonde sur les capacités Fastify de l’organisation sélectionnée. Le registre est remonté lors d’un changement d’identité ou d’organisation, et les requêtes obsolètes sont annulées.
- La recherche se déclenche à la soumission, par code, nom ou description. Le filtre permet les deux statuts ou tous les statuts. La recherche et le filtre reviennent en page 1. `DataTable` affiche le total et le nombre de pages renvoyés par le serveur et conserve son calcul habituel pour ses autres usages.

## Mutations et conflits

- La création envoie uniquement le nom et la description. Après le 201, le formulaire se ferme, le résultat confirmé est intégré à la page compatible avec le filtre et la relecture se fait séparément. En cas d’échec de relecture, le résultat reste visible dans cette page et « Réessayer » relance un GET. Un verrou de soumission empêche un double POST.
- L’édition d’une commission active conserve le code et transmet la version lue. Un 409 garde le brouillon, bloque la sauvegarde et propose une relecture avec comparaison. Une action séparée adopte explicitement la version affichée avant une éventuelle nouvelle sauvegarde.
- L’archivage demande confirmation et transmet la version ainsi que `ARCHIVED`. Un conflit ne déclenche aucune réémission automatique. L’action est de nouveau disponible après relecture réussie. Le détail archivé conserve les dates et la version. Les commandes de modification et d’archivage disparaissent, et l’interface ne propose ni réactivation ni suppression.

## Recette Chrome et intégrité

Le cycle complet a été exécuté dans Chrome avec Fastify et les émulateurs **Auth et Firestore**. Les ports jetables étaient 18432 pour Next.js, 18431 pour Fastify, 19098 pour Auth Emulator et 18082 pour Firestore Emulator, toutes les écoutes applicatives sur `127.0.0.1`. Le projet fictif était `demo-ikbs-l1a`. L’organisation synthétique `A2000001` et son compte local `demo.admin` ont remplacé l’organisation permanente pour cette recette, afin de tester l’archive terminale sans suppression physique.

Après vérification du projet, des destinations loopback, du registre vierge et des capacités effectives, Chrome a confirmé la connexion, la présence du menu, la création de `COM-000001` et la fermeture du popup, la recherche, la modification du nom et de la description et leur persistance après rechargement. Après confirmation d’archivage, le détail est resté consultable. Fastify a renvoyé l’état `ARCHIVED`, version 3, et la description modifiée. Les actions de modification et de réactivation étaient absentes.

L’instance jetable a été arrêtée. Le registre permanent D1000001 et son compteur n’ont servi à aucune écriture. Aucun document n’a été supprimé dans l’environnement de démonstration.

## Limite

Fastify filtre les résultats dans le périmètre d’organisation avant pagination. Le coût de lecture croît avec la taille du registre. L’interface envoie une recherche bornée et soumise explicitement, sans requête à chaque frappe.

## Tests et verdicts

- `node --test tests/auth.test.mjs tests/roles.test.mjs` · 13 tests réussis.
- `IKBS_TEST_CHROME=… node --test tests/auth-browser.test.mjs` · 1 scénario réussi avec serveur de réponses synthétiques. Couverture de la liste vide et du chargement, de la recherche et de la pagination serveur, du filtre d’archives, de l’annulation des réponses périmées, du POST unique, de la validation, du refus API et de la relecture en erreur, du brouillon et des 409, de la confirmation d’archivage, des accès lecteur et gestionnaire et du changement vers une organisation non habilitée. La première exécution avait une fixture de pagination incohérente. Le total de cette fixture a été corrigé avant la relance réussie.
- TypeScript, ESLint ciblé, build Next.js Webpack et `git diff --check` réussis.

| Contrôle | Verdict |
| --- | --- |
| Interface | PASS |
| Navigation et RBAC | PASS |
| Création | PASS |
| Modification | PASS |
| Archivage | PASS |
| Tests | PASS |
| Recette Chrome jetable | PASS |
| Intégrité des données de recette | VERIFIED |

F02-A2 s’arrête ici pour réception humaine.
