# IKBS — FT-01/E1 · Démarrage et confinement

**22 novembre 2026 — BLOCKED avant démarrage des quatre services.** Chrome jetable n’a pas pu initialiser ses processus sous le profil macOS qui interdit les sorties IP non locales. La confiance du navigateur dans le certificat et son confinement en fonctionnement restent à démontrer. La règle d’arrêt E1 a été appliquée avant tout lancement Firebase, Fastify ou Next.js.

[Préflight FT-01](IKBS-FT01-RECETTE-FONCTIONNELLE-LOCALE.md)

| Contrôle | Verdict | Preuve ou limite |
| --- | --- | --- |
| Ports | PASS | `lsof` sans écoute observée sur 19099, 18081, 18300 et 18301 avant essai puis après arrêt. Les ports auxiliaires envisagés 14400 et 14500 étaient libres au préflight. |
| Processus parent et descendant de contrôle | PASS pour la sonde | Deux processus Node lancés avec `env -i`, HOME et TMPDIR dédiés, même profil Seatbelt hérité. Pour les deux, `192.0.2.1:18300` a rendu `EPERM` et `127.0.0.1:18300` a rendu `ECONNREFUSED`, cohérent avec un port local libre. Ces résultats ne mesurent pas un processus Java, Fastify ou Next.js en fonctionnement. |
| TLS local | PASS pour le certificat seul | Certificat autosigné éphémère RSA 2048, SAN IP `127.0.0.1`, validité 24 h. `openssl verify -CAfile … -verify_ip 127.0.0.1 …` a réussi. Empreinte SHA-256 `07:0F:52:0F:AF:78:96:DC:14:C2:54:EE:75:C7:F3:AD:5C:D2:01:52:67:57:17:F2:A4:24:93:63:C8:F2:21:6D`. Aucun ajout de confiance au système. La clé privée éphémère a été supprimée. |
| Chrome jetable | BLOCKED | Chrome 158, profil neuf, page `data:` et télémétrie de démarrage réduite. Premier essai, PID 77387, sortie 21 après refus de `bind` sur `SingletonSocket`. Second essai avec exception limitée au socket Unix d’instance, sorties IP toujours limitées à la boucle locale, sortie 133. Diagnostic expurgé `sandbox initialization failed: Operation not permitted`. Aucune page de contrôle rendue. |
| Services, projet et configuration effective | BLOCKED | Aucun des quatre services démarré. Aucun PID ni environnement de service à déclarer. La communication Next.js → Fastify, les sorties de chaque processus et la confiance TLS de Chrome restent non vérifiées. |

## Configuration identifiée pour un futur démarrage

- Auth Emulator `127.0.0.1:19099` et Firestore Emulator `127.0.0.1:18081`, projet `demo-ikbs-l1a`, CLI Firebase JavaScript 13.32.0 et JAR Firestore 1.19.8 déjà en cache. Prévoir une configuration jetable explicite, avec les règles Firestore du dépôt et aucun import ou export. L’espace de travail créé par E1 était neuf et aucun répertoire de données n’a été peuplé.
- Fastify `127.0.0.1:18300`, factory existante `src/app/app.ts#buildApp`, à appeler depuis un lanceur temporaire. Le lanceur standard `src/app/server.ts` lie toutes les interfaces et est écarté. Le profil test doit imposer le projet fictif, les deux hôtes d’émulateur loopback, l’origine CORS exacte et les factories Firebase de test. Aucun secret Firebase ou Google n’a été chargé par les sondes. L’environnement effectif des services devra être vérifié au démarrage.
- Next.js HTTPS `127.0.0.1:18301`, origine backend `IKBS_API_ORIGIN=http://127.0.0.1:18300`, avec les options TLS locales documentées par Next.js. Le certificat de cette passe a seulement servi au préflight. La réécriture et le SSR n’ont servi aucune requête.

Le premier profil Seatbelt utilisait littéralement `127.0.0.1:*` et a été rejeté par le compilateur de profil. Avec le sélecteur `localhost:*` accepté par macOS, les sondes TCP ont réussi. L’essai Chrome limité à la page intégrée a ensuite révélé le blocage décrit ci-dessus. Après les essais, aucune écoute E1 et aucun processus Chrome correspondant au profil jetable n’ont été observés. Aucun service Docker n’a été arrêté ou modifié. Aucun accès Firebase réel, donnée métier ou changement applicatif.

La prochaine réception doit porter sur un moyen de lancer un navigateur jetable tout en démontrant le refus des connexions non locales et la confiance dans le seul certificat de recette. Les écoutes, les environnements, l’héritage du confinement et le relais HTTPS resteront alors à vérifier avant toute opération métier.

**P3 reste BLOCKED. L1-C.3 reste FAIL. La production reste NON AUTORISÉE. Réception humaine demandée avant reprise.**
