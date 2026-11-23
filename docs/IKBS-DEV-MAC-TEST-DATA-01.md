# IKBS — DEV-MAC / TEST-DATA-01

**Préflight documentaire terminé. Une configuration strictement loopback est identifiée dans le JAR local. Sa validation dynamique et la création des données attendent une autorisation distincte.**

## Diagnostic Firestore

Deux refus successifs sont documentés dans les journaux locaux des essais précédents.

| Étape | Adresse ou port réellement demandé | Cause |
| --- | --- | --- |
| Firebase CLI 13.32.0, recherche du WebSocket de l’UI | `127.0.0.1:9150` | Le CLI vérifie le port WebSocket même avec l’UI désactivée. Ce port était absent du profil. Fixer `websocketPort=19150` a permis de franchir cette première étape. |
| Firestore Java 1.19.8, initialisation de WebChannel | TCP IPv4 `0.0.0.0:0` sous `-Djava.net.preferIPv4Stack=true` | `CloudFirestore.init`, ligne 240, appelle `findOpenPort()` en l’absence de `webchannelPort`. Ligne 382, la méthode ouvre `new ServerSocket(0)`, lit le port attribué puis ferme le socket. Adresse générique et port éphémère, sans garantie de port fixe. Seatbelt refuse ce bind avec `EPERM`. |

L’analyse de `javap -p -c -l` sur le JAR raccorde les lignes de la pile d’erreur aux deux branches de sélection de port. Le JAR accepte `--host`, `--port`, `--websocket_port` et `--webchannel_port`. Les deux ports auxiliaires non nuls évitent les deux appels à `findOpenPort()` dans cette méthode. Le bytecode transmet l’hôte configuré aux constructeurs du serveur gRPC, du WebSocket et de WebChannel. Le CLI en cache transmet le WebSocket mais son contrôleur n’alimente pas `webchannel_port` dans la configuration actuelle. [Contrat Java ServerSocket](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/net/ServerSocket.html) · [Firestore Emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore)

### Solutions

- **Retenue pour validation.** Démarrer Auth seul avec le CLI local et Firestore directement depuis le JAR en cache. Fixer les trois adresses Firestore à l’hôte `127.0.0.1` par les options du JAR. Ports 18081 pour l’API, 19150 pour WebSocket, 19151 pour WebChannel. Le profil Seatbelt garde une liste de ports loopback et un refus des connexions non locales. L’option WebChannel est marquée dépréciée dans le JAR. Requalifier le choix à tout changement de version.
- Une future version peut modifier la configuration des ports auxiliaires. Son adoption exigerait un préflight distinct.
- L’autorisation générale de bind sur `*:*` a été refusée par le contrôle automatique lors de l’essai précédent. Elle est hors du plan retenu.

## Commandes préparées

Le lanceur temporaire se trouve dans `/private/tmp/ikbs-test-data-01.xXllmjS3/dev-mac.cjs`. Contrôles réussis pour `node --check` et `--check`. Aucun service démarré. Le frontend existant sur `127.0.0.1:18301` a été observé et laissé en place. La pile de démonstration utilisera un frontend HTTPS distinct sur 18302.

```sh
NODE="$HOME/.nvm/versions/node/v24.18.0/bin/node"
KIT=/private/tmp/ikbs-test-data-01.xXllmjS3/dev-mac.cjs
"$NODE" --check "$KIT"
"$NODE" "$KIT" --check
# Après autorisation uniquement
"$NODE" "$KIT" --start
```

Sous le même profil réseau et avec environnement vidé, le lanceur exécute le CLI Firebase en `emulators:start --only auth --project demo-ikbs-l1a` avec configuration temporaire. Son invocation Firestore est équivalente à la suivante, où `WORK` et `JAVA_HOME` sont déterminés par le lanceur.

```sh
"$JAVA_HOME/bin/java" -jar "$WORK/emulators/cloud-firestore-emulator-v1.19.8.jar" \
  --host 127.0.0.1 --port 18081 --websocket_port 19150 --webchannel_port 19151 \
  --project_id demo-ikbs-l1a --single_project_mode true --single_project_mode_error true \
  --rules "$WORK/firestore.rules"
```

Le superviseur vérifie les propriétaires et interfaces des ports, appelle la factory Fastify existante sur 18300, puis lance Next.js HTTPS avec `IKBS_API_ORIGIN=http://127.0.0.1:18300` et CORS exact sur `https://127.0.0.1:18302`. Il attend un 401 anonyme relayé sur `/api/v1/auth/me`. Arrêt prévu par **Ctrl+C** dans ce terminal, qui termine les groupes créés par cette exécution. Le frontend 18301 reste hors du superviseur.

## Fonctionnalités existantes et URLs prévues

| URL ou endpoint | Ce qui peut être vérifié |
| --- | --- |
| `https://127.0.0.1:18302/organisations` et `/organisations/D1000001` | Annuaire public et fiche de l’organisation active. |
| `https://127.0.0.1:18302/login` et `/espaces` | Connexion et orientation ou sélection selon les capacités de session. |
| `https://127.0.0.1:18302/dash` et `/dash/organisations` | Administration et gestion des organisations avec la permission globale correspondante. |
| `https://127.0.0.1:18302/espace/D1000001` | Profil de l’organisation. Le bouton **Modifier le profil** dépend de `organization.profile.update`. L’admin local peut modifier les champs de profil disponibles, dont nom, présentation, contact, adresse et logo. Un membre en lecture seule consulte les informations. |
| `https://127.0.0.1:18302/api/v1/auth/me` | Profil de session, capacités globales et espaces accessibles. Consulter dans le navigateur authentifié pour comparer les comptes. |

Le backend expose login, me et logout, les listes et fiches publiques d’organisations, le CRUD protégé d’organisations et les opérations de demandes d’adhésion (création, liste, détail, approbation, refus). Le modèle **Organisation** a un UUID, un code et un statut, avec champs de profil. Le modèle métier **Membre** a ses propres identifiant et code, nom, prénom, username, email et statut. Les cas d’usage de membre sont présents mais aucune route HTTP Membre n’est câblée dans Fastify et le repository Firestore de membre est commenté. Une **appartenance** est portée par les autorisations de l’identité, avec UUID d’organisation, état actif, rôle et permissions. Cela suffit à démontrer l’accès sans créer de faux enregistrements métier de membre.

Aucun écran séparé exposant un annuaire des membres, la gestion de leurs appartenances, l’édition des rôles et permissions, les commissions ou des paramètres généraux n’est identifié. L’édition du profil constitue le paramétrage organisationnel disponible dans l’espace local.

## Jeu de données proposé

Organisation **IKBS Démonstration**, code `D1000001` conforme au format, UUID neuf et statut `ACTIVE`. Les adresses ci-dessous sont réservées aux tests. Les mots de passe seront générés et remis localement après validation.

| Identifiant de test | Rôle | Appartenance et accès attendus |
| --- | --- | --- |
| `demo.global@example.test` | `SUPER_ADMIN` | Aucune appartenance locale nécessaire pour tester le registre global. Accorde `organizations.global.manage`, `requests.platform.submit`, `requests.platform.review`. |
| `demo.admin@example.test` | `ORGANIZATION_ADMIN` | Appartenance active à D1000001. Accorde `organization.read` et `organization.profile.update`. |
| `demo.membre1@example.test` | `MEMBER` | Appartenance active à D1000001, permission explicite `organization.read` seule. |
| `demo.membre2@example.test` | `MEMBER` | Même accès de lecture. |
| `demo.membre3@example.test` | `MEMBER` | Même accès de lecture. |

Le domaine et le schéma d’autorisations n’exposent aucun rôle de responsable de commission. Le jeu ne contient donc pas de compte avec ce rôle. Pour le peuplement autorisé, utiliser le repository Organisation qui valide ses objets métier, puis créer les sujets dans Auth Emulator et les enregistrer via `StoredIdentities.register` avec le sujet Firebase et l’issuer attendu pour le projet. Installer les appartenances via `StoredAuthorization.replace`, primitive interne de provisionnement synthétique, avec l’UUID réel de l’organisation de recette et seulement les permissions décrites ci-dessus. Conserver `memberId: null` tant qu’aucun enregistrement métier de membre ne peut être créé par le repository Firestore existant. Vérifier les comptes via le login normal et le CSRF normal.

## Préconditions restantes

Recontrôler les huit ports et l’identité des processus avant peuplement. Confirmer l’écoute strictement IPv4 loopback de tous les services, le projet `demo-ikbs-l1a`, un stockage neuf sans import, les deux destinations émulateur attendues, le profil de refus des sorties et l’absence de credentials Firebase/Google réels. Ne créer aucune fixture tant que Firestore n’a pas démarré avec les deux ports explicites et que Fastify n’a pas répondu à travers Next.js. Après peuplement, vérifier les cinq connexions, les capacités et les pages dans Chrome avec son sandbox natif et un certificat éphémère local. Aucun de ces contrôles dynamiques n’a été exécuté.

**Aucun compte créé, aucun service démarré dans cette étape. Réception humaine demandée avant démarrage ou peuplement. P3 reste BLOCKED, L1-C.3 reste FAIL et la production reste NON AUTORISÉE.**
