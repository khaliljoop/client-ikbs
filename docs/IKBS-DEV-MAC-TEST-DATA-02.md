# IKBS — DEV-MAC / TEST-DATA-02

**BLOCKED avant peuplement.** Le JAR Firestore a franchi le blocage WebChannel de TEST-DATA-01. Il a ensuite tenté d’ouvrir un socket gRPC interne distinct sur `127.0.0.1:0`. Le profil approuvé autorise seulement les ports fixes de la recette. Le superviseur a interrompu cette exécution et aucun compte ni document n’a été créé.

## Contrôles exécutés

- Lanceur `/private/tmp/ikbs-test-data-01.xXllmjS3/dev-mac.cjs` relu intégralement et cohérent avec TEST-DATA-01. Mode 600, date de naissance et date de modification identiques. `node --check` et `--check` réussis. SHA-256 relevé avant lancement et revérifié immédiatement avant exécution `c6a854ee50bebffda7c8dcf0ec95426a217d62029dfd2627477477d2593f1c0f`. Aucun SHA-256 historique indépendant n’avait été consigné lors du contrôle statique précédent.
- Ports 14400, 14500, 18081, 18300, 18302, 19099, 19150 et 19151 sans écoute avant démarrage. Le port 18301 était déjà sans écoute lors de cette passe. Aucun signal envoyé au frontend existant ni à un processus Docker.
- Superviseur PID 33967. Auth Emulator PID 34025, écoute vérifiée sur `127.0.0.1:19099`. Le CLI a annoncé le projet fictif `demo-ikbs-l1a` et les ports auxiliaires 14400 et 14500. Auth et Firestore ont reçu l’environnement vidé du lanceur, un HOME neuf, et aucun argument d’import. La sonde préalable hors boucle locale a réussi au sens du garde `EPERM`. Le journal Auth confirme aussi un `EPERM` sur une tentative de découverte de métadonnées à l’adresse link-local. Le contrôle complet des interfaces de chaque service en fonctionnement est resté incomplet.
- Firestore a journalisé `Started WebSocket server on ws://127.0.0.1:19150`, puis `Failed to bind to address /127.0.0.1:0` avec `SocketException: Operation not permitted`. Sortie 1. Aucune écoute Firestore stable à déclarer. Fastify et Next.js HTTPS n’ont pas été lancés. Leur environnement effectif, le 401 relayé et les protections dynamiques restent non vérifiés. Aucun changement des factories, de trustProxy, de RBAC ni de CSRF.

## Nouveau blocage et suite possible

La lecture de `io.gapi.emulators.grpc.GrpcServer` dans le JAR en cache confirme deux constructions d’adresse. L’une prend l’hôte et le port configurés. L’autre passe le même hôte et le littéral port 0 à `NettyServerBuilder.forAddress`. Cette deuxième écoute demande au système un port éphémère **sur la boucle locale**. Les options `--websocket_port` et `--webchannel_port` ne fixent pas ce socket gRPC interne.

Une prochaine étape distincte peut étudier une autorisation Seatbelt ciblée sur le bind éphémère loopback pour le seul processus Firestore, en conservant le refus des sorties non locales et en vérifiant toutes ses écoutes. Son effet exact doit être démontré avant de réutiliser le lanceur. Aucune permission supplémentaire appliquée et aucune relance effectuée dans cette passe.

## Fixtures et vérifications fonctionnelles

Organisation D1000001, compte super-administrateur, compte administrateur local et trois comptes membre **non créés**. Aucun mot de passe généré. Cinq connexions, permissions de session, annuaire et fiche publics, registre global, espace local, lecture seule, refus d’accès et déconnexion **non testés**. Aucune URL de démonstration validée disponible sur 18302. Les routes prévues restent celles de [TEST-DATA-01](IKBS-DEV-MAC-TEST-DATA-01.md).

## Arrêt et nettoyage

Le superviseur a arrêté ses groupes après l’échec Firestore. Le journal Auth confirme l’arrêt d’Auth, du Hub et du service de journaux. La clé TLS a été supprimée. Un nouveau relevé `lsof` ne montre aucune écoute sur les ports de cette exécution. Aucun arrêt complémentaire n’est requis. Les journaux locaux privés restent dans `/private/tmp/ikbs-dev-mac-run.ScKDJs`. Les extraits d’erreur utiles sont retranscrits ci-dessus. Ce répertoire de cette seule exécution peut être supprimé après réception si les journaux ne doivent pas être conservés.

**FT-01/E1 reste BLOCKED. P3 reste BLOCKED. L1-C.3 reste FAIL. La production reste NON AUTORISÉE.**
