# IKBS — DEV-LOCAL-01 · Phase 1 — Audit et proposition

**Statut.** Audit terminé. L’implémentation et les essais de démarrage attendent la validation de la phase 2. Le peuplement attend une validation distincte de la phase 3. Cette proposition concerne le développement quotidien sur macOS. Elle n’exige ni coupure du Mac ni profil Seatbelt de recette.

## État des deux projets

| Sujet | Constat |
| --- | --- |
| Compose backend | `docker-compose.yml` publie actuellement le port hôte 3000 par défaut sans adresse de bind, charge `.env.docker` et fixe un nom de conteneur. L’override automatique cible l’étage `build`, exécute `npm run dev` et force `NODE_ENV=development`. Ces paramètres ne forment pas un profil Auth + Firestore Emulator. |
| Dockerfile et scripts | Les étages Node 22 Alpine installent les dépendances. L’étage build compile TypeScript. `npm run dev` exécute `tsx watch src/app/server.ts`. `npm start` lance le JavaScript compilé. Fastify écoute sur toutes les interfaces dans son espace d’exécution. En bridge, borner la publication côté Mac à `127.0.0.1`. Le Dockerfile et le Compose de production peuvent être conservés. |
| Firebase CLI | `firebase.json` déclare Firestore sur 8080 et l’UI sur 4000. Auth et les hôtes ne sont pas explicites. Le CLI JS 13.32.0 et le JAR Firestore 1.19.8 sont déjà disponibles dans le cache local utilisé par les essais précédents. |
| Admin SDK | Le mode de test impose `demo-ikbs-l1a`, l’absence de credentials réels et des hôtes `127.0.0.1:port`. Le mode hors test de la factory Auth refuse les hôtes d’émulateur, puis sélectionne un chemin Firebase réel lorsque ses préconditions sont satisfaites. Le Compose de développement actuel ne doit donc pas être utilisé tel quel pour cette recette. Les helpers destructifs dépendent du garde strict des tests et doivent le conserver. |
| Client SDK et origine | Aucun SDK Firebase client trouvé dans les dépendances et sources examinées. Le navigateur parle à Fastify via les chemins Next relatifs `/api/v1`. La réécriture et les lectures SSR utilisent `IKBS_API_ORIGIN`, avec un défaut local sur 3000. La clé `NEXT_PUBLIC_API_URL` n’est pas utilisée par ces chemins. |
| Authentification web | La session est un cookie HttpOnly, Secure, SameSite=Lax. Les mutations vérifient notamment l’origine exacte et `X-IKBS-Request`. Conserver HTTPS côté Next.js, même en développement, et aligner `CORS_ORIGINS` sur l’URL exacte. |
| Super-administrateur et seed | Les noms relevés dans `.env`, `.env.example` et `.env.docker` ne contiennent aucune variable dédiée au super-administrateur. Aucun bootstrap ni seed autonome branché dans les scripts ou l’entrée serveur examinés. Les primitives existantes sont `StoredIdentities.register` pour l’identité et ses alias, et `StoredAuthorization.replace` pour les droits. Le repository Organisation expose `findByCode` et `save`, avec les objets métier et le mapper existants. |
| Routes | Fastify expose login, me et logout, l’annuaire public et le CRUD d’organisations, ainsi que les opérations sur les demandes d’adhésion. Next.js expose notamment `/login`, `/organisations`, `/organisations/[organizationCode]`, `/dash`, `/dash/organisations`, `/espaces` et `/espace/[organizationCode]`. Aucun écran autonome de gestion des membres, des rôles, des commissions ou des paramètres généraux identifié. L’édition du profil existe dans l’espace organisation pour le rôle autorisé. |

Les fichiers d’environnement ont été examinés par noms de clés. Aucune valeur secrète n’a été copiée. Aucun service ou conteneur de test n’a été démarré. La résolution de `host.docker.internal` et la joignabilité des émulateurs depuis Docker restent à démontrer.

## Modification minimale proposée pour la phase 2

1. **Firebase.** Créer une configuration locale distincte `firebase.dev-local.json` avec Auth 19099, Firestore 18081, WebSocket 19150, Hub 14400, Logging 14500 et UI désactivée. Déclarer `127.0.0.1` pour les services et conserver les règles et index du dépôt. Le CLI choisit un port WebChannel et le JAR ouvre un socket gRPC interne éphémère. En développement classique ces ouvertures doivent être inventoriées par PID avec `lsof`, y compris les descendants, avant acceptation. Un bind fixe vaut uniquement pour le socket observé. Vérifier le projet unique et l’absence d’import et de credentials.
2. **Trajet Docker.** Utiliser un Compose local autonome, sans nom de conteneur imposé, sans env_file de production et sans publication LAN. Réutiliser le Dockerfile et Fastify. Publier `127.0.0.1:18300:3000`. Dans un conteneur jetable de phase 2, vérifier la résolution IPv4 de `host.docker.internal` puis l’accès aux deux émulateurs lancés en loopback sur le Mac. Docker documente le nom spécial. Son existence seule ne prouve pas la joignabilité d’un listener loopback dans cette configuration. Si cette liaison échoue, arrêter l’essai et arbitrer une liaison locale explicitement bornée avant de poursuivre. Écarter une écoute émulateur générale sur le LAN. [Réseau Docker Desktop](https://docs.docker.com/desktop/features/networking/)
3. **Compatibilité des factories.** Si le bridge atteint les émulateurs, ajouter une branche dédiée au profil local Docker, activée explicitement seulement sous `NODE_ENV=test`, avec projet exact `demo-ikbs-l1a`, les deux destinations exactes `host.docker.internal:19099` et `host.docker.internal:18081`, et rejet de tout credential fournisseur. Construire uniquement les clients émulateur dans cette branche et refuser toute configuration partielle avant l’initialisation. Conserver intégralement le garde loopback des suites et scripts de nettoyage. Refuser le profil hors test. Couvrir les refus avec des tests ciblés. Les choix de session, CSRF, RBAC, rate limit et trustProxy restent ceux du code existant. Cette branche ne vaut pas confinement réseau certifié. La validation exige aussi que les deux cibles correspondent aux processus émulateurs identifiés sur le Mac.
4. **Next.js.** Garder les scripts npm existants. Prévoir un exemple local avec `IKBS_API_ORIGIN=http://127.0.0.1:18300` et une invocation de `npm run dev` sur `127.0.0.1:18302` en HTTPS. Générer les fichiers TLS éphémères hors dépôt et vérifier la confiance de développement du navigateur. Configurer Fastify avec l’origine exacte `https://127.0.0.1:18302`. Le script `npm start` est `next start` et exige un `npm run build` compatible préalable. Il n’est pas nécessaire pour le cycle quotidien.
5. **Livrables d’implémentation.** Préparer le Compose local, la configuration Firebase locale, les exemples d’environnement sans valeurs secrètes, le script de seed non appelé au démarrage et un README. Le Compose autonome nécessite `-f` pour éviter l’override existant. Une fois validé, un alias local peut raccourcir la commande. La phase 2 vérifie l’annuaire vide, le TLS, le relais Fastify via Next et le 401 sans session, sans peupler les émulateurs.

### Commandes cibles, non exécutées

```sh
# Terminal 1, backend. Employer le CLI JS local si la commande firebase globale est incompatible.
firebase emulators:start --only auth,firestore --project demo-ikbs-l1a --config firebase.dev-local.json

# Terminal 2, backend
docker compose -f compose.dev-local.yml up --build

# Terminal 3, frontend. Fournir les chemins locaux de la clé et du certificat.
IKBS_API_ORIGIN=http://127.0.0.1:18300 npm run dev -- \
  --hostname 127.0.0.1 --port 18302 --experimental-https \
  --experimental-https-key "$DEV_TLS_KEY" --experimental-https-cert "$DEV_TLS_CERT"
```

Démarrer dans l’ordre et attendre les contrôles avant de passer au service suivant. Arrêter dans l’ordre inverse avec Ctrl+C dans les terminaux concernés. Pour retirer seulement les ressources du Compose local, utiliser `docker compose -f compose.dev-local.yml down`. Les fichiers locaux dédiés et ces commandes de démarrage seront validés en phase 2.

## Seed proposé pour la phase 3

- Créer **IKBS Démonstration** (`D1000001`), **Dahira Démonstration** (`D1000002`) et **Association Démonstration** (`D1000003`) en statut `ACTIVE`. Chercher chaque code d’abord, créer par le repository et les objets métier existants seulement s’il manque. Reprendre le même UUID lors d’une relance et refuser une collision étrangère au seed.
- Prévoir cinq identités dans Auth Emulator, un `SUPER_ADMIN`, `demo.admin@example.test` en `ORGANIZATION_ADMIN` et `demo.membre1@example.test` à `demo.membre3@example.test` en `MEMBER`. L’admin et les membres appartiennent à D1000001. L’admin local reçoit lecture et modification du profil par la politique existante. Les membres ont explicitement `organization.read` seule. Garder `memberId: null` tant que le repository métier Membre n’est pas opérationnel. Aucun autre rôle ajouté.
- Pour le compte global, réutiliser les clés locales si elles sont fournies ultérieurement. Sinon proposer `DEV_SUPER_ADMIN_EMAIL` et `DEV_SUPER_ADMIN_PASSWORD` dans un fichier privé ignoré par Git, lu uniquement par la commande de seed. Aucun mot de passe dans l’exemple, les logs, le Compose ou les arguments de processus. Utiliser un compte fictif et des mots de passe dédiés à l’émulateur.
- Après vérification des deux hôtes, des ports, du projet et de leurs processus, créer ou retrouver le sujet Auth par l’adresse fictive puis utiliser `StoredIdentities.register` et `StoredAuthorization.replace`. Vérifier l’association exacte du sujet et les droits avant de déclarer un enregistrement déjà provisionné. Refuser les conflits et éviter de remplacer des droits modifiés silencieusement. Exécuter le seed deux fois et vérifier l’absence de doublons, l’identité des UUID et la stabilité des appartenances. Les mots de passe existants ne sont pas réinitialisés lors d’une relance.

### URLs et critères de vérification prévus

| URL | Contrôle |
| --- | --- |
| `https://127.0.0.1:18302/login` | Connexion du super-administrateur, de l’admin local et des membres. Vérifier également la déconnexion. |
| `https://127.0.0.1:18302/organisations` | Les trois organisations et leurs fiches publiques, par exemple `/organisations/D1000001`. |
| `https://127.0.0.1:18302/dash/organisations` | Registre global accessible au super-administrateur et refusé aux comptes locaux. |
| `https://127.0.0.1:18302/espace/D1000001` | Édition du profil visible pour l’admin local et lecture seule pour les membres. |
| `https://127.0.0.1:18302/espaces` et `/api/v1/auth/me` | Appartenances, permissions, redirection et refus après déconnexion. |

**Décision attendue.** Valider la configuration locale distincte et l’adaptation bornée des factories pour passer à la phase 2. Si vos variables de super-administrateur sont définies dans un autre fichier, indiquer uniquement ses noms de clés ou son emplacement. Le seed et les vérifications des accès restent en phase 3.

**FT-01/E1 BLOCKED · P3 BLOCKED · L1-C.3 FAIL · Production NON AUTORISÉE.**
