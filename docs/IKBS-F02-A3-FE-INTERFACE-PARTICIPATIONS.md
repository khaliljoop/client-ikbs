# IKBS — F02-A3-FE · Participations aux commissions

## Interface et contrats

Sur `/espace/[organizationCode]/commissions`, le détail propose **Informations générales** et **Participants**. Le registre reste le point d’entrée. L’onglet Participants présente les périodes, les dates UTC, le statut courant de la fiche et l’effectivité fournie par Fastify. Une période ouverte peut être non effective pour plusieurs raisons, affichées ensemble. L’archive préserve les dates et l’historique et place les participations en lecture seule.

- `CommissionWorkspace.tsx` intègre les onglets et relit la commission après conflit. Le registre est remonté lors d’un changement d’identité ou d’organisation.
- `CommissionParticipants.tsx` gère la liste, les cinq filtres, les pages de dix périodes, le retrait confirmé et les notifications. Un changement de filtre revient à la première page. Les lectures inutiles sont annulées à la fermeture ou au changement de périmètre.
- `ParticipationMemberPicker.tsx` utilise la recherche F01 sur soumission et des pages de dix fiches actives. Une participation ouverte visible dans les résultats désactive la fiche correspondante. Fastify vérifie aussi les périodes situées hors de la page et du filtre courants.
- `src/lib/api/commissions.ts` adapte les trois routes F02-A3 au client commun avec session, CSRF et `no-store`. Le POST transmet uniquement `memberId`. Le PATCH transmet `CLOSED` et la version affichée.
- `Modal.tsx` donne à chaque dialogue un identifiant de titre propre. Le retrait utilise le dialogue partagé, porté au niveau du document pour que la confirmation soit accessible au-dessus de la fiche.

## Résolution et habilitations

Les routes F01 de lecture exigent `organization.read`, déjà requise pour lire les participations. Le contrat ne définit pas de permission `members.read` distincte pour ces routes. La résolution utilise l’UUID de la fiche, dans la même organisation. Elle conserve seulement le nom, le code, l’UUID et le statut. Les données personnelles éventuellement renvoyées au titulaire de `members.write` ne sont ni conservées dans le tableau ni affichées. La lecture d’une fiche archivée exige `members.lifecycle`. Une fiche protégée, absente ou momentanément indisponible conserve un libellé explicite et sa période demeure consultable selon les droits F02. Aucun UUID brut ne sert de libellé.

Les mutations nécessitent `commissions.read`, `commissions.members.manage` et une commission active. La permission `commissions.manage` couvre le registre et ne suffit pas pour gérer les participants. Le client utilise les capacités effectives de la session. Fastify revérifie chaque action. Après un 403, le client commun demande une actualisation des capacités et le panneau retire ses actions de mutation.

## Mutations, historique et coût

L’affectation se fait fiche par fiche. Une requête en cours verrouille la soumission. Après succès, le formulaire se ferme, le résultat confirmé apparaît si la page et le filtre le permettent, puis la liste est relue. Après un échec de relecture, le bouton de reprise relance uniquement le GET. Les conflits de doublon, de version, de clôture, d’éligibilité et d’archivage sont signalés. Les refus d’accès et les fiches disparues sont également traités. Lorsque la ressource a changé, la commission et les participations sont relues. Toute nouvelle mutation exige une action explicite.

Le retrait clôture la période, y compris quand elle est ouverte et non effective. Une nouvelle affectation crée un nouvel UUID de période. L’historique conserve la période et sa date de clôture.

La résolution des noms effectue au plus dix lectures F01 distinctes par page, par lots de cinq. Il n’existe pas de résolution groupée dans le contrat F01. Le client ne charge pas le répertoire complet et n’ajoute pas de compteurs globaux. Le filtre d’effectivité conserve le coût serveur documenté par F02-A3-BE, qui lit les statuts nécessaires avant pagination.

## Vérifications

- `IKBS_TEST_CHROME=… node --test tests/auth.test.mjs tests/roles.test.mjs tests/auth-browser.test.mjs` a terminé avec 14 tests réussis. La suite navigateur avec réponses synthétiques couvre les onglets, les filtres et la pagination, une réponse périmée, les états vide et erreur, le POST unique, la conservation d’un résultat après échec du GET, le doublon hors filtre, la confirmation, la version, le conflit de retrait, l’historique et la révocation des capacités. Elle rejoue les scénarios F02-A2 et F01.3-G, dont l’affectation et la révocation RBAC, ainsi que la navigation privée et l’isolation SSR.
- `tsc --noEmit --incremental false`, ESLint ciblé sur les composants et services modifiés et la suite Chrome, `npm run build -- --webpack` et `git diff --check` réussis.
- Recette Chrome à 390 px via Next.js et Fastify réels. Connexion avec les comptes synthétiques via l’API normale depuis Chrome. Organisation `A3000001`, deux commissions et deux fiches. Chrome a affecté la même fiche dans deux commissions, vérifié son nom et son code après rechargement, puis affiché les changements d’effectivité produits par la désactivation et la réactivation depuis la fiche F01. Le retrait, la consultation de l’historique, la réaffectation et le gel après archivage ont été vérifiés. L’API a refusé le doublon et confirmé les UUID distincts et la date de clôture conservée. Le lecteur et le gestionnaire du registre ont obtenu un refus de mutation. Le gestionnaire des participations a effectué une affectation depuis l’interface sans `commissions.manage`.
- La première exécution intégrée a reçu un 403 attendu sur la désactivation. La fixture administrateur ne portait pas `members.lifecycle`. L’octroi a été ajouté dans la fixture jetable pour rejouer le parcours F01 autorisé. L’archivage du registre a été exercé via l’interface dans la suite navigateur synthétique et via Fastify dans la recette intégrée.
- Une exécution de la suite synthétique s’est arrêtée sur le scénario historique de retour après connexion. Le test a remplacé son attente fixe par une vérification de la disponibilité du formulaire et de la navigation effective. L’assertion sur la destination interne a été conservée.
- Une relance a révélé que la fixture paginée plaçait la période ouverte sur la deuxième page. Le scénario d’archive applique désormais le filtre des périodes ouvertes avant d’en vérifier l’effectivité.

## Intégrité de la recette

Projet fictif `demo-ikbs-l1a`, Auth Emulator `127.0.0.1:19098`, Firestore Emulator `127.0.0.1:18082`, Fastify `127.0.0.1:18471` et Next.js HTTP local sur le port 18472. Les émulateurs ont démarré sans import dans un environnement de variables nettoyé, avec contrôle du projet et des sockets avant le peuplement. Le profil des services limitait les sorties à la boucle locale. Chrome a utilisé un profil jetable avec son sandbox natif. Cette recette fonctionnelle ne qualifie pas l’isolation réseau du navigateur ni FT-01/E1. Le 401 anonyme a été vérifié à travers Next.js. Les processus jetables sont arrêtés, les ports libérés et les identifiants de fixture supprimés. Les écritures ont visé uniquement l’instance jetable et l’organisation `A3000001`. Aucune écriture n’a visé `D1000001`. Les changements préexistants aux invitations des membres ont été préservés.

## Verdicts

| Contrôle | Verdict |
| --- | --- |
| Interface | PASS |
| Affectation | PASS |
| Retrait | PASS |
| Historique | PASS |
| Effectivité | PASS |
| RBAC | PASS |
| Résolution des membres | PASS |
| Tests | PASS |
| Non-régression | PASS |
| Recette Chrome | PASS |
| Intégrité des données | VERIFIED |

F02-A3-FE est soumis à réception humaine.
