# IKBS — DEV-MAC / TEST-DATA-05 · Préflight réseau et restauration

**22 novembre 2026 — Préflight en lecture seule.** Le Mac dispose d’un chemin IPv4 et IPv6 actif via le Wi-Fi, d’interfaces de proximité et de six interfaces de tunnel. Une coupure native paraît possible, sous réserve de vérifier les chemins de proximité et les tunnels après désactivation et de disposer d’une procédure de restauration locale. Aucune isolation hors ligne n’a été démontrée dans cette phase.

[Arbitrage TEST-DATA-04](IKBS-DEV-MAC-TEST-DATA-04-ARBITRAGE.md) · [Sondes Seatbelt TEST-DATA-03](IKBS-DEV-MAC-TEST-DATA-03.md)

## Inventaire initial observé

| Élément | État relevé |
| --- | --- |
| Système | macOS 27.2.1, build 26B131, ARM64. Emplacement réseau `Automatic`. |
| Boucle locale | `lo0` actif, `127.0.0.1` et `::1`. À conserver. |
| Wi-Fi | `en0` sous tension et lien actif. IPv4 DHCP sur `192.168.1.0/24`, passerelle `192.168.1.1`. IPv6 automatique, adresses globales et lien local. Route IPv6 par défaut via un routeur lien-local sur `en0` dans la table noyau. |
| Ethernet et Thunderbolt | `en3` et `en4` inactifs. `en1` et `en2` inactifs, membres de `bridge0` inactif. `anpi0` et `anpi1` inactifs. |
| Services réseau | `Wi-Fi`, `Thunderbolt Bridge`, `USB 10/100 LAN` (en12), `USB 10/100 LAN 2` (en13), `iPhone USB` (en6) configurés et activés. Les périphériques en6, en12 et en13 n’étaient pas visibles dans l’inventaire des interfaces actives. Les quatre services hors Wi-Fi sont en DHCP, IPv6 automatique. |
| Proximité | `awdl0` actif avec IPv6 lien-local et routes multicast. `llw0` porte aussi une IPv6 lien-local. `ap1` inactif, `nan0` sans adresse IP relevée. Bluetooth allumé. Aucun service `Bluetooth PAN` configuré. |
| Tunnels | `utun0` à `utun5` ont des adresses IPv6 lien-local et des routes IPv6 par défaut à portée d’interface. `scutil --nwi` désigne en0 comme chemin actif. `scutil --nc list` ne liste aucun VPN configuré. Cela ne permet pas d’identifier les propriétaires des utun ni de conclure qu’ils ne peuvent relayer aucun flux. `gif0` et `stf0` sans lien ou adresse actif observé. |
| DNS | Résolveurs effectifs via en0, routeur IPv4 `192.168.1.1` et routeur IPv6 lien-local, avec résolveur de portée en0. Aucun DNS manuel déclaré pour les cinq services. Des entrées supplémentaires non atteignables sont présentes dans `scutil --dns`. |
| Proxys | Dictionnaire système vide. HTTP, HTTPS, SOCKS, PAC et découverte automatique désactivés pour les cinq services. Aucun nom de variable proxy courant relevé dans la session examinée. Réglages privés des applications et relais loopback non démontrés absents. |
| Partage Internet | Forwarding IPv4 et IPv6 à 0. Aucun job `com.apple.InternetSharing` ou `com.apple.bootpd` dans la consultation ciblée. État du bouton Partage Internet à confirmer dans Réglages Système avant la coupure. |
| Reconnexion et relais | `configd`, `mDNSResponder`, `bluetoothd`, `sharingd`, `rapportd` et plusieurs composants Docker observés. Aucune extension système listée. Aucun gestionnaire VPN tiers reconnu par la recherche de noms réalisée. Ces observations sont non exhaustives. Aucun processus arrêté. |

Les routes spécifiques recensées incluent le LAN, le lien-local IPv4/IPv6, le multicast en0, awdl0, llw0 et utun, en plus du loopback. Une disparition des seules routes par défaut laisserait ces chemins à évaluer. Les consultations réseau ont utilisé `ifconfig`, `netstat`, `networksetup`, `scutil`, `sysctl`, `launchctl`, `system_profiler`, `systemextensionsctl`, `ps` et `lsof`. Certaines consultations de configuration ont nécessité une exécution autorisée en lecture seule après un refus du sandbox. Aucune sonde réseau distante effectuée.

## Plan de coupure et de restauration — commandes préparées, non exécutées

Utiliser un terminal sur le Mac, avec accès physique, et une copie locale de ce rapport avant toute interruption. S’assurer que la session de pilotage ne dépend pas du réseau et que les autres utilisateurs ou travaux Docker peuvent tolérer la coupure de connectivité. Refaire l’inventaire juste avant l’intervention. Si de nouveaux services, routes ou tunnels apparaissent, adapter le plan avec validation avant de continuer.

### 1. Capturer l’état immédiatement avant

```sh
umask 077
STATE=$(mktemp -d /private/tmp/ikbs-reseau-avant.XXXXXXXX)
printf '%s\n' "$STATE"
{
  date -u
  sw_vers
  networksetup -getcurrentlocation
  networksetup -listallhardwareports
  networksetup -listnetworkserviceorder
  networksetup -getairportpower en0
  for service in 'Wi-Fi' 'Thunderbolt Bridge' 'USB 10/100 LAN' 'USB 10/100 LAN 2' 'iPhone USB'; do
    printf '\n[%s]\n' "$service"
    networksetup -getnetworkserviceenabled "$service"
    networksetup -getinfo "$service"
    networksetup -getdnsservers "$service"
    networksetup -getwebproxy "$service"
    networksetup -getsecurewebproxy "$service"
    networksetup -getsocksfirewallproxy "$service"
    networksetup -getautoproxyurl "$service"
    networksetup -getproxyautodiscovery "$service"
  done
  ifconfig -a
  netstat -rn -f inet
  netstat -rn -f inet6
  scutil --nwi
  scutil --dns
  scutil --proxy
  scutil --nc list
  sysctl net.inet.ip.forwarding net.inet6.ip6.forwarding
  lsof -nP -iTCP -sTCP:LISTEN
} > "$STATE/inventaire.txt" 2>&1
```

Consigner dans le même dossier l’état de Bluetooth, AirDrop, Partage Internet et des câbles, ainsi que chaque changement réellement effectué. Conserver le dossier privé. Examiner les échecs de lecture avant d’agir.

### 2. Couper, après autorisation distincte

Débrancher les éventuels câbles Ethernet, Thunderbolt réseau et téléphone USB. Empêcher leur branchement pendant la session. Commandes correspondant aux services actuellement activés, à utiliser seulement si leur nom et leur état correspondent à la capture initiale.

```sh
sudo /usr/sbin/networksetup -setairportpower en0 off
sudo /usr/sbin/networksetup -setnetworkserviceenabled 'Thunderbolt Bridge' off
sudo /usr/sbin/networksetup -setnetworkserviceenabled 'USB 10/100 LAN' off
sudo /usr/sbin/networksetup -setnetworkserviceenabled 'USB 10/100 LAN 2' off
sudo /usr/sbin/networksetup -setnetworkserviceenabled 'iPhone USB' off
```

Dans Réglages Système, désactiver Bluetooth pour la session après vérification qu’un clavier et un dispositif de pointage restent utilisables. Vérifier AirDrop et Partage Internet. Si l’un est actif et peut relayer un flux, consigner sa valeur et demander la suspension ciblée avant de continuer. Aucun service Bluetooth PAN n’est à désactiver dans l’inventaire actuel. Ne pas tuer les daemons système ou Docker. Pour awdl0 et llw0, réinspecter état et routes après la coupure des radios. Si une liaison de proximité subsiste, arrêter la qualification et faire valider une mesure ciblée. Aucun `ifconfig down` générique planifié.

Les utun peuvent subsister sans réseau physique. Pour chacun, contrôler les routes, l’état d’interface et l’existence éventuelle d’un relais effectif. Une route de portée indéterminée ou une reconnexion non expliquée bloque le démarrage. Un VPN nommé qui apparaîtrait au nouveau préflight doit être attribué à son outil de gestion. Pour un service macOS identifié, `scutil --nc stop "$VPN_AUTORISE"` et ensuite `scutil --nc start "$VPN_AUTORISE"` sont des commandes conditionnelles à valider sur son nom exact et à utiliser uniquement si la capture le donnait connecté. Aucun VPN de ce type n’a été identifié ici. Préserver lo0 et ne pas éditer à la main les tables de routes, DNS ou proxys.

### 3. Restaurer depuis le terminal local

Arrêter la pile de démonstration puis confirmer la disparition de ses seuls PID et écoutes **avant** de rétablir le réseau. Réactiver uniquement les éléments modifiés, selon le journal de la session. Pour l’état actuellement observé, la restauration inverse des cinq commandes est la suivante.

```sh
sudo /usr/sbin/networksetup -setnetworkserviceenabled 'iPhone USB' on
sudo /usr/sbin/networksetup -setnetworkserviceenabled 'USB 10/100 LAN 2' on
sudo /usr/sbin/networksetup -setnetworkserviceenabled 'USB 10/100 LAN' on
sudo /usr/sbin/networksetup -setnetworkserviceenabled 'Thunderbolt Bridge' on
sudo /usr/sbin/networksetup -setairportpower en0 on
```

Restaurer Bluetooth, AirDrop, partage, branchements et éventuel VPN uniquement s’ils ont été modifiés et selon la valeur consignée. Vérifier la réassociation Wi-Fi dans Réglages Système et comparer `ifconfig -a`, `netstat -rn -f inet`, `netstat -rn -f inet6`, `scutil --nwi`, `scutil --dns`, `scutil --proxy` et `scutil --nc list` à la capture. Une adresse DHCP, une adresse IPv6 temporaire et les entrées dynamiques de voisinage peuvent changer après reconnexion. Restaurer les réglages initiaux et vérifier le fonctionnement équivalent. Vérifier ensuite la résolution avec `/usr/bin/dscacheutil -q host -a name "$NOM_TEST_AUTORISE"` en utilisant un domaine préalablement convenu, sans requête Firebase. Si une restauration échoue, utiliser Réglages Système pour le service ciblé, relever l’erreur et comparer au journal local. Éviter un reset global, une réécriture DNS, un redémarrage Docker ou la remise en route de la démonstration. Aucune automatisation privilégiée de restauration installée.

## Qualification hors ligne future — sondes non exécutées

Les sondes commencent après l’inventaire hors ligne. Ne lancer aucun service IKBS tant qu’un chemin non local reste explicable seulement par hypothèse.

| Contrôle | Sonde ou preuve préparée | Limite et critère |
| --- | --- | --- |
| Routes IPv4 et IPv6 | `netstat -rn -f inet`, `netstat -rn -f inet6`, `scutil --nwi`, `route -n get -inet 192.0.2.1`, `route -n get -inet6 2001:db8::1`. Examiner aussi routes LAN, lien-local, multicast, interfaces scoping et VPN. | L’absence de route par défaut seule est insuffisante. Toute route effective hors loopback à expliquer avant démarrage. |
| TCP externe | `/usr/bin/nc -4 -G 2 -zv 192.0.2.1 443` et `/usr/bin/nc -6 -G 2 -zv 2001:db8::1 443`. | Adresses de documentation. Un timeout isolé ne prouve rien. Corréler l’échec au diagnostic de routes et à l’absence de trafic sortant sur les interfaces inventoriées. |
| LAN | Vérifier la route vers `192.168.1.1` et la disparition du chemin en0. Une sonde depuis ou vers un équipement LAN de contrôle exige une destination et un port autorisés. | L’absence de réponse d’un routeur ou d’un appareil éteint ne suffit pas. Couvrir voisins lien-local et proximité IPv6. |
| DNS | `scutil --dns` et `dig @192.0.2.53 sonde-<nonce>.invalid A +time=1 +tries=1`, puis contrôle du résolveur système sur un nom unique convenu, après preuve de coupure. | Le premier test vérifie un chemin DNS IP direct. Cache, mDNS et DoH demandent inspection de configuration et observation. NXDOMAIN ne vaut pas preuve de coupure. |
| VPN et relais | `scutil --nc list`, `scutil --proxy`, variables proxy par nom, écouteurs TCP/UDP locaux, configuration du navigateur, état des utun et des services de partage. | Un dictionnaire proxy vide ne couvre pas les applications ni Docker. Aucun relais actif vers un autre espace réseau ne doit subsister. |
| Loopback et descendants | Avant IKBS, petit serveur de contrôle sur `127.0.0.1`, client parent et enfant, matrice TCP locale positive et externe négative. Relever les PID et l’arborescence. | Le succès local ne prouve pas l’isolement. Rejouer pendant le contrôle Chrome et par groupes de lancement. |
| Reconnexion automatique | Relever périodiquement `ifconfig -a`, `scutil --nwi`, routes, DNS et ports durant la session. Contrôler les changements d’interface et observer le trafic si une capture est autorisée. | Toute transition vers un chemin non local impose arrêt des seules tâches de recette avant restauration. |
| Écoutes effectives | `lsof -a -p "$PID" -nP -iTCP -sTCP:LISTEN` par PID et descendant, plus sondes locales d’application. Pour Java, couvrir API, WebSocket, WebChannel et le port gRPC attribué au bind `127.0.0.1:0`. | Exiger `127.0.0.1` sur chaque socket. `*`, `0.0.0.0`, `[::]`, adresse LAN, PID inconnu ou port interne non attribué bloquent. |

## Dépendances et configuration de la démonstration

- Node 24.18.0, Java ARM64 23.0.1, Firebase CLI JavaScript 13.32.0 déjà en cache et JAR Firestore 1.19.8 présents. `node_modules` backend et frontend présents. Next.js 16.3.5. Le lanceur TEST-DATA-01 passe `node --check`. Le lancement et la résolution complète de toutes les dépendances en mode déconnecté restent à vérifier.
- Chrome 158.0.8127.36 présent, à utiliser en profil jetable avec sandbox natif. OpenSSL 3.6.5 présent. L’ancienne clé de recette relevée en TEST-DATA-02 est supprimée. Générer un certificat éphémère avec SAN IP `127.0.0.1` dans une phase autorisée. Tester la confiance spécifique à la recette sans magasin système ni désactivation des contrôles TLS.
- Profil visé. Projet `demo-ikbs-l1a` seul et répertoires neufs sans import ni identifiant réel. Auth 19099, Firestore 18081, WebSocket 19150, WebChannel 19151, Fastify 18300 et Next.js HTTPS 18302 sur `127.0.0.1`. Ports auxiliaires Firebase 14400 et 14500 également à vérifier. Le port 18301 est réservé au frontend existant si présent et reste hors périmètre. Aucun port DEV-MAC n’était visible en écoute lors du relevé ciblé.
- Le lanceur précédent reste utile comme référence de ports, d’environnement et de vérifications. Son profil Seatbelt à ports fixes a bloqué le socket gRPC interne. Il faut qualifier et approuver le mode de lancement natif sous la coupure indépendante avant de réexécuter la pile. Ne pas réutiliser l’exception `localhost:*` rejetée. Vérifier au démarrage l’environnement vidé, les destinations Firebase Emulator, les écoutes, l’origine Next.js et le 401 anonyme avant tout peuplement.

## Risques et décisions humaines

La coupure déconnecte aussi les applications existantes qui utilisent le Mac. Les processus locaux peuvent encore accéder aux émulateurs en loopback. Les tunnels non attribués, relais locaux, interfaces de proximité et mécanismes de reconnexion exigent une preuve dynamique. La restauration dépend d’un terminal local, des droits nécessaires, de la disponibilité du réseau initial et de l’état consigné. Garder les données strictement synthétiques et exclure les tâches locales non nécessaires à la session, sous contrôle humain.

**Réception demandée** pour l’inventaire et le plan. Avant TEST-DATA-06, autoriser explicitement la fenêtre de coupure et sa restauration, confirmer l’accès terminal local et le contrôle des radios et tunnel, et approuver la méthode de surveillance ainsi que le traitement de tout chemin résiduel. Le démarrage des services et le peuplement demeurent des décisions distinctes. Aucun changement réseau, service ni donnée créé en TEST-DATA-05.

**FT-01/E1 : BLOCKED. P3 : BLOCKED. L1-C.3 : FAIL. Production : NON AUTORISÉE.**
