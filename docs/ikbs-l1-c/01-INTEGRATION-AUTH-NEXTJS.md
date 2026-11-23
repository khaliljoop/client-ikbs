# L1-C.1 — Intégration Next.js de la session IKBS

## Périmètre et résultat

Le frontend Next.js 16.3.5 utilise les routes d’authentification Fastify. La session reste dans le cookie Secure et HttpOnly émis et révoqué par l’API. Le frontend initialise les vues privées depuis `/auth/me` et consulte le même contrat dans le navigateur. Fastify demeure l’autorité pour les permissions, les appartenances et les opérations métier.

La recette a utilisé Chrome headless en HTTPS sur la boucle locale et un backend HTTP simulé. Aucune preuve Firebase réelle, aucune donnée de production, aucune modification backend ou Flutter. Les décisions d’accès par permission et organisation dans la navigation appartiennent à L1-C.2.

## Fichiers et contrats

| Fichiers | Changement |
|---|---|
| `next.config.ts`, `src/lib/api/origin.ts` | Réécriture externe de `/api/v1/:path*` vers une origine HTTP(S) serveur fixe. Déclaration de `Cache-Control: private, no-store` pour les routes privées. |
| `src/lib/api/client.ts`, `src/lib/api/auth.ts`, `src/types/auth.ts` | Service de connexion, lecture de profil et déconnexion. Base navigateur relative. JSON pour les corps, en-tête `X-IKBS-Request: 1` pour les mutations, credentials de même origine, requêtes sans cache et refus des redirections de l’API. Les exceptions conservent statut, code d’erreur et Retry-After. 204 est traité comme une réponse vide. |
| `src/lib/auth/server-session.ts`, `src/lib/auth/session-cookie.ts`, `src/lib/auth/redirect.ts` | Lecture serveur App Router de la seule valeur de cookie attendue, puis appel direct au backend sans cache. Validation stricte des retours vers des chemins internes connus. |
| `src/components/auth/SessionGate.tsx`, `SessionProvider.tsx`, `SessionUserMenu.tsx`, `LegacyAuthCleanup.tsx` | Affichage et récupération de la session, déconnexion, purge de la clé historique. Le menu utilisateur est commun aux deux espaces. |
| `src/app/(public)/login/page.tsx`, `src/app/layout.tsx`, layouts sous `/dash` et `/espace`, `src/components/admin/AdminHeader.tsx`, `src/components/layout/OrganizationHeader.tsx` | Branchement de la connexion email ou username, de la purge et du rendu de session sur les composants existants. |
| `src/lib/auth/mock-auth.ts`, `src/mocks/auth.ts`, `src/features/organizations/components/OrganizationAuthGuard.tsx` | Suppression des fichiers propres à l’authentification simulée. Le menu organisationnel simulé a été déplacé et raccordé à la session réelle. Les autres démonstrations sont conservées. |
| `src/types/organization.ts`, `src/lib/api/organizations.ts`, pages publiques d’organisations, `OrganizationPublicList.tsx`, `OrganizationPublicCard.tsx` | Type public distinct avec code, nom, description, logo et statut actif. Retrait de l’affichage des coordonnées privées. Le CRUD utilise toujours son DTO privé et ses composants historiques. |
| `tests/auth.test.mjs`, `tests/auth-browser.test.mjs` | Vérifications de contrat avec Node et recette Chrome HTTPS sur backend simulé, sans dépendance installée. |

Le formulaire garde le mot de passe en mémoire pendant la saisie et le vide après succès. La purge de `ikbs_mock_user` retire l’ancien objet sans le relire. Aucun mot de passe ni profil de connexion n’est écrit en stockage persistant par le module. L’identité affichée vient de `user.displayName`. Le frontend distingue un 401 d’un refus 403 ou d’une indisponibilité 503. Le formulaire présente aussi les erreurs 400 et 429. Un 503 pendant la déconnexion permet un nouvel essai.

## Session SSR, client et routage de recette

1. Le layout privé appelle `/auth/me` à partir du contexte de la requête en transmettant uniquement `__Host-ikbs_session`. L’appel vise l’origine backend configurée, sans suivre de redirection et sans cache. Le composant client reçoit le DTO de session, dont les capacités, sans recevoir le cookie comme prop.
2. Une session absente ou refusée renvoie vers la connexion. Une panne offre un nouvel essai sur place. Le client recontrôle au retour au premier plan, sur les pages restaurées, chaque minute quand la page est visible et à l’échéance absolue annoncée. Un 401 des appels métier déclenche aussi le retour à la connexion. Les appels `/auth/me` ne prolongent pas la durée de session, par contrat backend.
3. Après login et logout, la navigation recharge le document et abandonne le cache de navigation de l’ancienne page. Le retour accepte uniquement des chemins internes connus, sans requête arbitraire. Le repli est l’accueil. Un accès anonyme initial à l’espace d’administration conserve `/dash` comme destination. La perte de session côté client conserve la page si elle est autorisée comme retour.
4. Aucun rôle n’est décidé dans Next.js. Le layout fait une vérification de session pour le rendu. Fastify continue de contrôler chaque lecture et mutation privée. Les layouts App Router peuvent persister entre navigations. Les futures lectures privées côté serveur devront faire leur propre contrôle près de l’accès aux données.

`IKBS_API_ORIGIN` est lu uniquement côté serveur et dans la configuration Next.js. Par défaut `http://127.0.0.1:3000`. Utiliser une URL sans chemin, avec le backend réellement bindé sur l’interface prévue. Définir la même valeur au build et au démarrage pour que la réécriture et les appels serveur pointent vers le même service. Le navigateur utilise `/api/v1`. Fastify doit autoriser l’origine exacte de Next.js dans sa configuration existante `CORS_ORIGINS`. La recette a vérifié le passage de l’origine et de l’en-tête de mutation, ainsi que des réponses Set-Cookie de création et d’effacement.

Exemple de lancement, avec certificat et clé déjà disponibles pour l’hôte de recette.

```sh
IKBS_API_ORIGIN=http://127.0.0.1:3000 npm run dev -- --hostname 127.0.0.1 --port 3001 \
  --experimental-https --experimental-https-key /chemin/cle.pem \
  --experimental-https-cert /chemin/certificat.pem
```

L’origine à autoriser côté Fastify pour cet exemple est `https://127.0.0.1:3001`. La recette automatisée a créé une clé et un certificat éphémères et utilisé un profil Chrome temporaire. Aucun inverseur de proxy ni certificat permanent n’a été installé. Les réponses privées au niveau API conservent `no-store`. Next.js en développement a renvoyé `no-cache, must-revalidate` sur le HTML dynamique. Un démarrage local du build a confirmé `private, no-store` sur le 307 anonyme de `/dash`.

## Vérifications

| Commande | Résultat |
|---|---|
| `node --test tests/auth.test.mjs` | 5 tests réussis. Login, en-têtes, codes 400/401/403/429/503, réponse de déconnexion, cookies isolés entre appels et retours internes. |
| `IKBS_TEST_CHROME="/chemin/vers/Chrome" node --test tests/auth-browser.test.mjs` | 1 scénario réussi avec Chrome 158 headless sur HTTPS. Vérifie refus de login et 429, connexion, cookie Secure/HttpOnly non visible par JavaScript, purge du stockage historique, deux profils SSR concurrents, annuaire et profil public réduit, requêtes CRUD passant par le routage, déconnexion, repli des redirections externes et expiration après réessai. |
| `tsc --noEmit --incremental false` | Réussi après génération des types Next. |
| `NEXT_TELEMETRY_DISABLED=1 npm run build -- --webpack` | Réussi. Routes privées et détail public compilés en rendu dynamique. La tentative Turbopack par défaut a été interrompue faute de progression. |
| `eslint next.config.ts src/components/auth src/lib/api src/lib/auth src/types/auth.ts tests` | Réussi. |
| `npm run lint` | 3 erreurs préexistantes et 14 avertissements. Les erreurs portent sur un caractère non échappé dans la démonstration DataTable et les effets React existants de l’annuaire et du gestionnaire d’organisations. L’erreur de l’annuaire a aussi été reproduite sur la version HEAD. |
| `git diff --check` | Réussi. |

Le test navigateur vérifie le routage des requêtes CRUD et le rendu du layout de gestion sur données simulées. La recette fonctionnelle bouton par bouton des formulaires de gestion sur Fastify réel reste ouverte.

## Réserves et préconditions L1-C.2

- Disposer d’un environnement Fastify isolé avec comptes synthétiques et d’un Auth Emulator compatible. Le blocage x86_64/arm64 documenté dans L1-B reste ouvert. Les garanties de cookies en navigateur ont été testées sur le contrat simulé, et la recette intégrée avec Firebase Auth reste à mener.
- Valider les parcours globaux et locaux, la lecture des permissions et les états d’absence d’appartenance. Les organisations du DTO ne pilotent pas encore le choix d’espace, les liens ni les contrôles d’interface.
- Valider la topologie HTTPS de recette et la préservation des attributs de cookie et des en-têtes privés dans l’environnement choisi. L’exposition production et la recette L1-C.3 restent séparées.
- Attendre l’autorisation explicite de L1-C.2.
