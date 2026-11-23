# IKBS — FT-01 · Recette fonctionnelle locale

**22 novembre 2026 — BLOCKED pour la recette en cours.** Le préflight identifie une topologie locale candidate. Les commandes habituelles dans leur configuration actuelle ne satisfont pas l’isolation exigée. Les contrôles statiques sont terminés et le démarrage des services attend une autorisation humaine distincte. Aucun résultat historique n’est repris comme résultat FT-01.

## Préflight

| Contrôle | Résultat FT-01 | Évidence et limite |
| --- | --- | --- |
| Dépendances locales | PASS pour l’inventaire | `node_modules` présent dans les deux projets. Next.js 16.3.5. Le Firebase global est x86_64 sur macOS ARM64. L’alternative JavaScript Firebase CLI 13.32.0 et le JAR Firestore 1.19.8 existent dans le cache local. Java ARM64 disponible. Aucun lancement d’émulateur pour confirmer la compatibilité actuelle. |
| Démarrage backend par défaut | BLOCKED | `npm run dev` lance `tsx watch src/app/server.ts`, et `npm start` lance le serveur compilé. Ce serveur écoute sur `0.0.0.0`, port 3000 par défaut et dans les fichiers locaux examinés. Le profil de développement lit dotenv et pointe vers Firestore sur 8080. Le port 8080 est déjà écouté par Docker sur une interface générique. L’identité du service derrière Docker n’a pas été interrogée. |
| Démarrage frontend par défaut | BLOCKED | `npm run dev` lance Next.js sur le port 3000 par défaut, également prévu pour Fastify. La réécriture `/api/v1/:path*` et les appels SSR utilisent `IKBS_API_ORIGIN`, par défaut `http://127.0.0.1:3000`. Le validateur autorise aussi une origine HTTP(S) distante syntaxiquement valide. L’origine locale doit donc être imposée et le réseau confiné. Le seul nom relevé dans `.env.local` est `NEXT_PUBLIC_API_URL`, sans référence dans le code applicatif parcouru. |
| Firebase Emulator et routes | PASS statique pour le profil candidat | En mode test, dotenv backend est ignoré. Les factories exigent `demo-ikbs-l1a`, des hôtes d’émulateurs IPv4 loopback et l’absence de credentials Firebase/Google et de clé API Auth réelle. L’URL Identity Toolkit locale est construite sur l’hôte Auth Emulator. Le chemin standard hors test peut cibler Identity Toolkit réel. Le profil doit rester en mode test avec les deux émulateurs actifs. |
| Confinement candidat | PASS pour la sonde TCP avant démarrage | Avec un profil macOS `sandbox-exec` qui interdit le réseau et autorise la boucle locale, la sonde vers `192.0.2.1:18300` a retourné `EPERM`. La sonde vers `127.0.0.1:18300` a retourné `ECONNREFUSED`. Cela démontre la distinction pour le processus sondé. Les descendants et le navigateur devront être vérifiés dans la recette autorisée. |
| Ports et coexistence | PASS à l’instant du contrôle pour les ports candidats | `lsof` n’a montré aucune écoute sur 18080, 18081, 18300, 18301, 19099, 14400 et 14500. Le port 8080 est écarté. Aucun service existant arrêté ou interrogé. Un nouveau contrôle sera nécessaire juste avant lancement. Aucun Nginx P3 engagé dans cette topologie. |

### Configuration candidate pour une phase distincte

- Démarrer Auth Emulator sur `127.0.0.1:19099` et Firestore Emulator sur `127.0.0.1:18081` avec le CLI local et le JAR déjà en cache. Employer une configuration jetable et explicite, le projet unique `demo-ikbs-l1a`, les règles du dépôt, l’interface UI désactivée et des ports de contrôle CLI explicites. Le `firebase.json` courant ne déclare que Firestore sur 8080 et l’UI sur 4000. Aucun import, export, projet historique ou téléchargement automatique.
- Utiliser la factory Fastify existante dans un lanceur de recette temporaire avec écoute explicite sur `127.0.0.1:18300`. Fournir un environnement vidé et une liste autorisée avec `NODE_ENV=test`, `AUTH_BACKEND=FIREBASE`, les deux hôtes d’émulateurs, le projet fictif, les repositories Firebase pour organisations et demandes, le générateur Firebase, une clé de limitation synthétique éphémère et l’origine CORS exacte. Conserver les durées et contrôles de sécurité existants. Aucun fichier dotenv ni identifiant réel injecté.
- Lancer Next.js HTTPS sur `127.0.0.1:18301` avec `IKBS_API_ORIGIN=http://127.0.0.1:18300`. Utiliser un certificat de recette éphémère et des profils navigateurs jetables. Vérifier la réécriture et les lectures SSR vers ce seul Fastify et vérifier le refus des sorties non locales de tous les processus. Contrôler le navigateur séparément, y compris les chargements externes éventuels issus des données affichées. Les appels navigateur utilisent le même origin, et les mutations conservent l’en-tête attendu par le CSRF.
- Avant tout peuplement ou nettoyage, confirmer PID, écoute loopback, projet exact, répertoires vierges et absence de credentials. Réserver, si nécessaire, une instance Firestore séparée sur 18080 pour les tests destructifs sous les gardes L1-B.1. Utiliser uniquement des identités et organisations synthétiques. Supprimer les artefacts de session et les données temporaires après recette.

## Contrôles statiques exécutés

Environnement vidé, HOME et TMPDIR temporaires, réseau entièrement interdit pour les commandes statiques. La première application imbriquée du profil a été refusée par le sandbox. Les commandes ont ensuite abouti avec le profil macOS appliqué dans l’exécution autorisée. Aucun service démarré.

| Contrôle | Commande | Résultat |
| --- | --- | --- |
| Backend TypeScript | `./node_modules/.bin/tsc --noEmit --incremental false` | PASS, sortie 0 |
| Backend TypeScript des tests | `./node_modules/.bin/tsc -p tsconfig.test.json --noEmit --incremental false` | PASS, sortie 0 |
| Backend ESLint | `./node_modules/.bin/eslint .` | PASS, sortie 0 |
| Frontend TypeScript | `./node_modules/.bin/tsc --noEmit --incremental false` | PASS, sortie 0 |
| Frontend ESLint | `./node_modules/.bin/eslint` | FAIL, sortie 1, 3 erreurs et 14 avertissements. Même bilan que L1-C.3. |

Anomalies ESLint frontend à traiter séparément.

- `src/app/(public)/data-table-demo/page.tsx:352` — `react/no-unescaped-entities`.
- `src/app/(public)/organisations/page.tsx:103` — `react-hooks/set-state-in-effect`.
- `src/features/organizations/components/OrganizationManagement.tsx:501` — `react-hooks/set-state-in-effect`.

Les journaux statiques temporaires se trouvent dans `/private/tmp/ikbs-ft01.h0KqZ2r6` pour le frontend et `/private/tmp/ikbs-ft01.yPCd7Jz4` pour le backend. Les preuves de cette passe sont les codes de sortie, les diagnostics lint et les observations réseau ci-dessus. Aucune capture d’interface, puisque le navigateur et les services n’ont pas été démarrés.

## Vérifications restant à exécuter

| Fonction ou contrôle | Statut |
| --- | --- |
| Suites mémoire backend et contrat frontend | Non exécutées dans cette passe limitée aux contrôles statiques. |
| Builds frontend et backend | Non exécutés. Prévoir des sorties isolées et le réseau fermé. |
| Suites Firestore et scénario navigateur existant | BLOCKED avant autorisation et qualification des processus de test. |
| Accès HTTPS au frontend, login synthétique, session et `/api/v1/auth/me` | BLOCKED avant démarrage autorisé. |
| Retours internes, navigation globale/locale, sélecteur et rôles | BLOCKED avant démarrage autorisé. |
| CRUD organisations et droits locaux/globaux | BLOCKED avant démarrage autorisé. |
| Réponses 401, 403 et 404 avec gardes réelles | BLOCKED avant démarrage autorisé. |
| Déconnexion, suppression de cookie et rejet de la session révoquée | BLOCKED avant démarrage autorisé. |
| Journaux frontend, backend et réseau pendant la recette | BLOCKED avant démarrage autorisé. Consigner des preuves expurgées. |

**P3 reste BLOCKED. L1-C.3 reste FAIL. La production reste NON AUTORISÉE.** Aucun changement applicatif, de sécurité ou de données. Réception humaine demandée sur le préflight et le profil loopback proposé avant toute autorisation de démarrage.
