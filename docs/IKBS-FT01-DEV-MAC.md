# IKBS — FT-01 / DEV-MAC

**22 novembre 2026 — Préflight statique terminé. Démarrage en attente de validation.**

**URL frontend** `https://127.0.0.1:18301`

| Service | Écoute prévue |
| --- | --- |
| Next.js HTTPS | `127.0.0.1:18301` |
| Fastify HTTP | `127.0.0.1:18300` |
| Firebase Auth Emulator | `127.0.0.1:19099` |
| Firestore Emulator | `127.0.0.1:18081` |
| Contrôle Firebase CLI | Hub `127.0.0.1:14400`, journaux `127.0.0.1:14500` |

## Vérifications effectuées

- Les six ports étaient sans écoute observée avec `lsof`. Le lanceur répète le contrôle au démarrage et s’arrête si un port est occupé.
- Le CLI JavaScript Firebase 13.32.0, le JAR Firestore 1.19.8, Java ARM64, `tsx` backend et le CLI Next.js sont présents localement. La recette utilise le CLI JavaScript en cache à la place du binaire Firebase global x86_64.
- La syntaxe du lanceur et son mode `--check` ont réussi. Une sonde Seatbelt sans service a obtenu `EPERM` vers l’adresse de documentation `192.0.2.1:18300` et `ECONNREFUSED` vers le port loopback alors libre. Le fonctionnement de la suite de services derrière le profil à ports limités reste à confirmer.
- Aucun serveur, navigateur ou émulateur n’a été lancé. Aucun certificat n’a été généré pendant cette première étape. Aucune configuration de production ou application n’a été modifiée.

## Commandes

Lanceur temporaire préparé dans `/private/tmp/ikbs-dev-mac-kit.JKK0HNju/dev-mac.cjs`. Les commandes utilisent Node 24.18.0 déjà présent. Le lanceur temporaire peut disparaître au nettoyage de macOS. Vérifier sa présence avant de demander le démarrage.

### Préflight uniquement

```sh
"$HOME/.nvm/versions/node/v24.18.0/bin/node" --check /private/tmp/ikbs-dev-mac-kit.JKK0HNju/dev-mac.cjs
"$HOME/.nvm/versions/node/v24.18.0/bin/node" /private/tmp/ikbs-dev-mac-kit.JKK0HNju/dev-mac.cjs --check
```

### Démarrage après validation humaine

Exécuter dans un terminal macOS et garder le superviseur au premier plan.

```sh
"$HOME/.nvm/versions/node/v24.18.0/bin/node" /private/tmp/ikbs-dev-mac-kit.JKK0HNju/dev-mac.cjs --start
```

Ordre prévu. Le lanceur crée une configuration Firebase temporaire, vérifie la barrière réseau, génère et vérifie le certificat, démarre les deux émulateurs, puis Fastify et Next.js. Il valide les écoutes et leurs groupes de processus, `GET /health` sur Fastify, puis le retour HTTP 401 attendu pour `GET /api/v1/auth/me` sans session via le relais HTTPS Next.js. Il affiche le chemin du certificat public et le PID du superviseur. Pour une vérification TLS indépendante, définir `WORK` à la valeur exacte affichée pour l’exécution.

```sh
/usr/bin/curl --noproxy '*' --cacert "$WORK/cert.pem" \
  -sS -o /dev/null -w '%{http_code}\n' https://127.0.0.1:18301/api/v1/auth/me
```

Ouvrir `https://127.0.0.1:18301` dans un profil navigateur de développement dédié avec son sandbox natif. Le certificat est autosigné, limité à l’IP loopback par le SAN et valable un jour. Le navigateur peut afficher un avertissement. Toute acceptation doit être limitée à cette origine et à ce certificat de développement, après comparaison de l’empreinte ci-dessous. Si le navigateur refuse une exception locale, le contrôle `curl --cacert` reste disponible. Aucune modification du magasin de confiance système.

```sh
/opt/homebrew/bin/openssl x509 -in "$WORK/cert.pem" -noout -fingerprint -sha256
```

La copie temporaire du frontend fige les sources au lancement et écarte les fichiers `.env*` du dépôt. Les changements effectués ensuite dans le dépôt demandent un redémarrage de la copie. Cette phase DEV-MAC ne qualifie pas le confinement réseau de Chrome en E1-B.

### Arrêt

Dans le terminal du superviseur, utiliser **Ctrl+C**. Depuis un autre terminal, utiliser le PID affiché par cette exécution après avoir vérifié la commande du processus.

```sh
/bin/ps -p "$PID_SUPERVISEUR" -o command=
kill -TERM "$PID_SUPERVISEUR"
for p in 18300 18301 19099 18081 14400 14500; do
  /usr/sbin/lsof -nP -iTCP:"$p" -sTCP:LISTEN
done
```

Le superviseur arrête ses groupes de processus et supprime la clé TLS, le HOME, les données temporaires et la copie du frontend. Les journaux restent dans le répertoire d’exécution de permissions privées. Ne partager que des extraits expurgés. Une écoute restante doit être identifiée avant toute intervention.

## Garde-fous Firebase et portée

- Projet fixe `demo-ikbs-l1a`. Configuration Firebase explicite, émulateurs Auth et Firestore seulement, règles et index du dépôt, UI désactivée, répertoires neufs et aucun import, export ou peuplement automatique.
- Fastify utilise `buildApp()` depuis `src/app/app.ts`, avec écoute explicitement limitée à `127.0.0.1:18300`. Environnement construit à partir d’une liste autorisée, `NODE_ENV=test`, `AUTH_BACKEND=FIREBASE`, deux hôtes d’émulateur exacts et aucun identifiant Firebase/Google ou clé API fournisseur injecté. La factory de test rejette les projets ou hôtes incohérents. Le lanceur utilise une clé de limitation éphémère et maintient les contrôles applicatifs et durées de session existants.
- Next.js reçoit `IKBS_API_ORIGIN=http://127.0.0.1:18300`. Fastify reçoit l’origine CORS exacte `https://127.0.0.1:18301`. La réécriture et SSR utilisent l’origine locale. Un profil Seatbelt par service bloque les sorties non locales et borne les connexions IP aux ports loopback du tableau. La vérification du relais ne crée aucune session et n’écrit aucune donnée métier.
- Aucune identité de test n’est précréée. Après vérification des écoutes et du projet, une recette de connexion exige la création de fixtures synthétiques dans les deux émulateurs. Ne fournir ni compte réel ni import historique.
- Blocage possible si le terminal ne peut pas appliquer Seatbelt, si Firebase CLI requiert une ressource absente du cache, ou si l’une des écoutes ou sondes échoue. Le lanceur s’arrête dans ces cas. Ne pas relancer avec un profil réseau plus permissif, un port déjà utilisé ou une base Firebase réelle.

**Aucun démarrage autorisé avant validation. P3 reste BLOCKED. L1-C.3 reste FAIL. La production reste NON AUTORISÉE.**
