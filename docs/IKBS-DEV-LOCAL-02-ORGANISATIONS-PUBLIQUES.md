# IKBS — DEV-LOCAL-02 · Liste publique des organisations

**23 novembre 2026 — PASS pour la correction du HTTP 500 et la pagination valide sur un registre vide.** Vérifié via Fastify et via le frontend Next.js existant. Aucune organisation créée.

## Cause racine

La requête `GET /api/v1/organizations/public?page=1&limit=9` atteint la route et le contrôleur public. Le cas d’usage demande au repository Firebase la liste des organisations actives. Les journaux Fastify corrèlent les requêtes de cette route à une erreur gRPC `14 UNAVAILABLE: No connection established. Last error: Protocol error` pendant la lecture de la requête Firestore, remontée en HTTP 500 par le gestionnaire centralisé. Le conteneur utilisait `host.docker.internal:8080` et le projet `apiikbs`. Le port 8080 était publié par Docker. L’émulateur Firestore de la démonstration était le processus Java PID 29294 sur `127.0.0.1:18081`, lancé avec `--project_id demo-ikbs-l1a`.

Depuis le conteneur, `host.docker.internal` a résolu en `192.168.65.254`. Le TCP a atteint 8080, 18081 et 19099. La présence d’un listener TCP sur 8080 ne prouve pas que ce listener sert Firestore Emulator. Seule la destination 18081 a été interrogée avec l’Admin SDK après vérification de son PID et de son projet. Cette lecture a réussi. La cause démontrée est la mauvaise cible Firestore dans le conteneur, accompagnée d’un ID de projet incompatible.

## Fichiers et configuration corrigée

- Backend `docker-compose.override.yml`. Profil de développement explicite, `FIREBASE_PROJECT_ID=demo-ikbs-l1a`, `FIRESTORE_EMULATOR_HOST=host.docker.internal:18081`, `IKBS_DOCKER_FIRESTORE_EMULATOR=1`. `METADATA_SERVER_DETECTION=none` empêche la découverte de métadonnées cloud de la bibliothèque dans ce profil. Port hôte 3000 publié uniquement sur `127.0.0.1` dans la configuration résolue.
- Backend `src/config/firebase.ts`. Le profil doit être explicitement activé en développement, avec le projet et l’hôte exacts et sans credentials Firebase/Google. Il utilise un client nommé sur l’émulateur avec gRPC sans TLS vers l’hôte local Docker. Les garde-fous loopback des suites de tests et le profil de production sont conservés. Aucun changement des routes, de l’authentification, du RBAC, du CSRF, du rate limit ou du gestionnaire d’erreurs.
- Le service API IKBS a été recréé par `docker compose up -d --no-build --no-deps api`, avec son image existante et ses sources montées. Aucun autre conteneur ni émulateur redémarré. L’Auth Emulator était joignable à 19099. Le Compose n’activait déjà pas le service Auth Fastify et ce travail ne configure pas le parcours de connexion.

## Vérifications

| Vérification | Résultat |
| --- | --- |
| TypeScript backend, ESLint de `src/config/firebase.ts`, `git diff --check` | PASS |
| Garde Docker avec mauvais projet, port 8080, mode production ou présence d’une variable de credentials | Quatre refus attendus avant initialisation |
| Fastify `GET /health` après démarrage | HTTP 200 |
| Lecture Admin SDK depuis Docker, collection réellement utilisée `service`, projet fictif | Réussie. Collection vide |
| Fastify `page=1&limit=9`, `page=2&limit=9` et `page=1&limit=1` | HTTP 200, résultat vide, page et limite retournées. Les frontières de pagination avec des données n’ont pas été exercées. |
| Relais Next.js existant sur `127.0.0.1:3001`, `page=1&limit=9` | HTTP 200, même réponse |
| Journaux du conteneur recréé | Aucune erreur de niveau 50 ou 60 ni alerte de découverte de métadonnées dans les 80 dernières lignes après les tests. |

Réponse réelle de Fastify et du relais Next.js pour page 1, limite 9.

```json
{"items":[],"total":0,"page":1,"limit":9,"totalPages":0}
```

**Anomalie de pagination distincte.** Le contrôleur actuel accepte `page=0` et `page=abc` avec HTTP 200. Le second cas renvoie `page:null`. La validation est restée inchangée pendant la correction du 500. La normalisation ou le refus des entrées invalides mérite un correctif séparé.

## Préparation du seed

Sur autorisation distincte, créer IKBS Démonstration (`D1000001`), Dahira Démonstration (`D1000002`) et Association Démonstration (`D1000003`) en statut `ACTIVE`. Vérifier le projet et les processus émulateurs, rechercher d’abord chaque code via `FirebaseOrganizationRepository.findByCode`, valider le code et l’identifiant par les objets métier existants, puis enregistrer via `save`. Réutiliser l’UUID d’une fixture déjà reconnue et refuser une collision étrangère au seed. Vérifier une seconde exécution sans doublons puis lire les trois fiches par l’API publique. Aucun seed exécuté.

**FT-01/E1 BLOCKED · P3 BLOCKED · L1-C.3 FAIL · Production NON AUTORISÉE.**
