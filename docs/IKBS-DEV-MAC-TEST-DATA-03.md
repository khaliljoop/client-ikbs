# IKBS — DEV-MAC / TEST-DATA-03 · Socket gRPC éphémère Firestore

**22 novembre 2026 — BLOCKED.** Sur macOS 27.2.1 (26B131), le compilateur Seatbelt rejette `localhost:0`. Le sélecteur `localhost:*` accepte le bind demandé par Firestore et autorise également des binds IPv4 et IPv6 génériques ainsi que le bind sur l’adresse IPv4 d’en0. Il est rejeté pour la recette. L’étape C n’a pas été ouverte et aucun émulateur n’a été démarré. [TEST-DATA-02](IKBS-DEV-MAC-TEST-DATA-02.md)

## Règles et périmètre

Le profil TEST-DATA-02 applique `(deny network*)` puis des exceptions `network-bind` et `network-inbound` en `(local ip "localhost:PORT")` et `network-outbound` en `(remote ip "localhost:PORT")` pour les ports fixes 14400, 14500, 18081, 18300, 18302, 19099, 19150 et 19151. L’appel Java à `127.0.0.1:0` ne correspond à aucun de ces ports. La reproduction avec le profil d’origine a retourné `EPERM`.

Deux ajouts ont été étudiés séparément dans des copies temporaires.

- `(allow network-bind (local ip "localhost:0"))` est rejeté à la compilation avec `invalid port in network address`, sortie 65.
- `(allow network-bind (local ip "localhost:*"))` compile. L’astérisque couvre tous les ports. Dans la sonde, `localhost` n’a pas distingué la boucle locale d’une adresse LAN ou générique.

Un troisième profil de compilation avec `(local ip "127.0.0.1:0")`, appliqué à `true`, a rendu `host must be * or localhost in network address`, sortie 65. Appliquer un profil distinct au lancement de Java permettrait de limiter une exception à Firestore et à ses descendants. La portée par processus ne corrige pas le filtre d’adresses de la règle étudiée. [Implémentation de profils Seatbelt](https://github.com/anthropics/sandbox-runtime/blob/main/src/sandbox/macos-sandbox-utils.ts)

## Sondes et résultats

Ruby système sous `env -i` et `sandbox-exec`. Sockets TCP fermés immédiatement. Les sondes de bind n’appellent jamais `listen()` ni `accept()`, y compris en cas de succès inattendu. Les connexions négatives ciblent uniquement les adresses de documentation `192.0.2.1:443` et `[2001:db8::1]:443`. La sonde relance le même programme comme descendant de son processus parent.

| Opération | Profil TEST-DATA-02 | Avec exception de bind `localhost:*` |
| --- | --- | --- |
| Bind IPv4 `127.0.0.1:0` | EPERM | Autorisé |
| Bind IPv4 `0.0.0.0:0` | EPERM | **Autorisé, hors périmètre** |
| Bind sur l’adresse IPv4 non loopback d’en0, port 0 | EPERM | **Autorisé, hors périmètre** |
| Bind IPv6 `[::1]:0` | EPERM | Autorisé |
| Bind IPv6 générique `[::]:0` | EPERM | **Autorisé, hors périmètre** |
| Bind IPv4 mappé `[::ffff:127.0.0.1]:0` | EPERM | Autorisé |
| Connexion TCP IPv4 et IPv6 hors loopback | EPERM dans les deux cas | EPERM dans les deux cas |
| Descendant | Mêmes résultats que le parent | Mêmes résultats que le parent |
| Code de sortie | 0, refus attendus | 1, binds interdits autorisés |

Le refus TCP sortant est resté vérifié pour les deux adresses sondées. Aucune conclusion n’est tirée sur tous les protocoles, les relais IPC ou le DNS. Les binds hors périmètre suffisent à invalider la règle au regard des critères de l’étape B. Aucune écoute hors périmètre n’a été ouverte et aucune fuite n’a été observée.

Sondes et profils reproductibles dans `/private/tmp/ikbs-td03.BQqgfJfy`. SHA-256 de `probe.rb` `ba84f975800a0e9d389baa3eac0018d4d226b2f1711c5136de45fc5df19cb5f3`.

## Écoutes et comportement Firestore

Après les sondes, `lsof` n’a montré aucune écoute sur 19099, 18081, 19150, 19151, 18300, 18301 ou 18302. Aucun processus E1 ni service existant n’a reçu de signal. Firestore n’a pas été relancé. La dernière preuve applicable reste TEST-DATA-02, WebSocket sur `127.0.0.1:19150` puis échec gRPC à `127.0.0.1:0`. Aucun compte, document ni configuration applicative créé.

## Conditions nécessaires à TEST-DATA-04

Privilégier un environnement de recette jetable sans carte réseau, avec les processus de test sur la même boucle locale de l’invité. Vérifier l’absence de carte, route externe et relais hôte, y compris pour IPv6 et les descendants. Refaire ensuite les sondes et vérifier toutes les écoutes, le projet fictif, un stockage neuf, les destinations et la réponse Firestore avant toute opération métier. Cette option nécessite une validation distincte et un invité qualifié. [Isolation du navigateur E1-B](IKBS-FT01-E1-B-QUALIFICATION-NAVIGATEUR.md)

Une autre voie consisterait à qualifier une version officielle de Firestore permettant de fixer le **port gRPC interne**, en plus des ports WebSocket et WebChannel. Aucune version offrant cette option n’a été démontrée. Toute variante doit conserver le refus des binds génériques, non loopback et des sorties externes. Le profil actuel peut être réutilisé uniquement après une preuve couvrant ce nouveau mode de démarrage.

**Réception humaine demandée. Aucun peuplement autorisé. FT-01/E1 et P3 restent BLOCKED. L1-C.3 reste FAIL. La production reste NON AUTORISÉE.**
