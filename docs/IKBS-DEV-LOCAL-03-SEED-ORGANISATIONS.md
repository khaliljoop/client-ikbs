# IKBS — DEV-LOCAL-03 · Seed des organisations

**23 novembre 2026 — PASS.** Trois organisations synthétiques actives sont visibles sur [l’annuaire local](http://localhost:3000/organisations). Sur ce Mac, `localhost:3000` atteint Next.js via `::1`. `127.0.0.1:3000` atteint directement Fastify, sans interface web. Les services en cours ont été laissés en place.

## Fichiers et commande

- Backend `src/scripts/seed-dev.ts` contient le seed.
- Backend `package.json` expose `seed:dev`.
- Aucun modèle, route, mécanisme d’authentification ou fichier de configuration de production modifié.

Depuis le terminal macOS, avec les émulateurs et le service Compose API en cours d’exécution.

```sh
cd /Users/senrm/Documents/mesprojets/backend/API_IKBS
npm run seed:dev
```

Le script vérifie le Hub, le PID qui écoute exclusivement sur `127.0.0.1:18081`, la ligne de commande Firestore et son projet exact, le profil développement du Compose, l’absence de variables d’identifiants et la collection `service`. Le processus du seed utilise ensuite la garde loopback existante du SDK en mode test, avec un projet et une destination imposés. Le conteneur API garde son profil développement Docker et `host.docker.internal:18081`.

Le code construit les entités avec `Organization`, `OrganizationCode` et `OrganizationId`, lit les codes via `findByCode`, vérifie les collisions d’UUID et enregistre les éléments manquants via `save`. Une transaction effectue toutes les lectures avant les écritures et évite un peuplement partiel en cas de collision. Les UUID déterministes et le nom/statut attendus identifient les fixtures. Toute organisation incompatible est préservée et le seed s’arrête.

| Organisation | Code | Statut |
| --- | --- | --- |
| IKBS Démonstration | D1000001 | ACTIVE |
| Dahira Démonstration | D1000002 | ACTIVE |
| Association Démonstration | D1000003 | ACTIVE |

Premier passage, 3 créations. Deuxième passage, 0 création et 3 fixtures reconnues. Contrôle TypeScript et ESLint du script réussis. Un essai en mode production a été rejeté avant connexion Firebase.

## Vérification de l’API et du navigateur

Réponse réelle HTTP 200 de `/api/v1/organizations/public?page=1&limit=9`, via Fastify et Next.js.

```json
{
  "items": [
    {"code":"D1000003","name":"Association Démonstration","status":"ACTIVE"},
    {"code":"D1000002","name":"Dahira Démonstration","status":"ACTIVE"},
    {"code":"D1000001","name":"IKBS Démonstration","status":"ACTIVE"}
  ],
  "total":3,"page":1,"limit":9,"totalPages":1
}
```

Avec `limit=1`, pages 1 à 3 comportant chacune un code distinct, total 3 et totalPages 3. La page 4 retourne un tableau vide et conserve le total. Les trois appels API de détail ont réussi. Chrome headless avec un profil jetable et son sandbox natif a rendu les trois noms dans l’annuaire et le nom correspondant dans chacune des fiches. Le test a vérifié le DOM hors scripts.

- [IKBS Démonstration](http://localhost:3000/organisations/D1000001)
- [Dahira Démonstration](http://localhost:3000/organisations/D1000002)
- [Association Démonstration](http://localhost:3000/organisations/D1000003)

Les réponses et DOM de contrôle sont conservés temporairement dans `/private/tmp/ikbs-dev-local-03-public.json` et `/private/tmp/ikbs-dev-local-03-browser.gvRj8x0J`. Aucune vérification de connexion privée réalisée. L’anomalie de pagination invalide signalée en DEV-LOCAL-02 reste hors périmètre.

## Persistance locale

Export officiel réussi depuis le Hub loopback du projet `demo-ikbs-l1a`. Avant l’export, la suite contenait uniquement la collection racine `service` avec les trois codes et aucun compte Auth. Répertoire privé mode 700 hors dépôt et manifeste vérifié. Firestore 1.19.8, CLI et Hub 14.1.0.

```text
~/.local/share/ikbs-dev/demo-ikbs-l1a-dev-local-03/
```

Un premier essai avec CLI 13.32.0 n’a pas reconnu le Hub 14.1.0. Utiliser le CLI local correspondant au Hub. Les émulateurs actuellement en cours n’ont pas été redémarrés et l’import reste à vérifier lors du prochain démarrage. [Export et import Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite/install_and_configure#export_and_import_emulator_data)

Pour restaurer la sauvegarde après arrêt normal de l’ancienne suite, dans le backend, utiliser le JAR et le CLI locaux déjà disponibles et uniquement le snapshot démonstration. L’export de fin de session va dans un nouveau dossier horodaté pour préserver le snapshot initial.

```sh
cd /Users/senrm/Documents/mesprojets/backend/API_IKBS
umask 077
ROOT="$HOME/.local/share/ikbs-dev"
SNAPSHOT="$ROOT/demo-ikbs-l1a-dev-local-03"
NEXT_SNAPSHOT="$ROOT/demo-ikbs-l1a-$(date +%Y%m%d-%H%M%S)"
CLI="$HOME/.npm-global/lib/node_modules/firebase-tools/lib/bin/firebase.js"
test -f "$SNAPSHOT/firebase-export-metadata.json" &&
node "$CLI" emulators:start --only auth,firestore --project demo-ikbs-l1a \
  --config firebase.json --import="$SNAPSHOT" --export-on-exit="$NEXT_SNAPSHOT"
```

Fermer normalement la suite pour que l’export de fin s’exécute. Vérifier ensuite le manifeste du nouveau snapshot et sélectionner explicitement le dernier export vérifié au prochain démarrage. Relancer `npm run seed:dev` après restauration pour confirmer 0 création et 3 présentes. Importer uniquement les exports du projet fictif local.

**FT-01/E1 et P3 restent BLOCKED. L1-C.3 reste FAIL. Production NON AUTORISÉE.**
