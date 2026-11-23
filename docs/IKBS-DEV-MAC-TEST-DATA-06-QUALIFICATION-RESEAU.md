# IKBS — DEV-MAC / TEST-DATA-06 · Qualification réseau macOS

**22 novembre 2026 à 23:38 UTC — BLOCKED avant coupure.** La confirmation explicite de la fenêtre et des conditions opérateur n’a pas été reçue. Le canal d’outil déclare `not a tty`. Il ne démontre ni l’accessibilité d’un terminal local pendant la coupure ni l’indépendance d’une session de contrôle à l’égard du réseau. La procédure n’a donc pas été déclenchée.

[Plan local de coupure et de restauration TEST-DATA-05](IKBS-DEV-MAC-TEST-DATA-05-PREFLIGHT-RESEAU.md)

## État initial observé

Inventaire en lecture seule. Aucun écart significatif avec TEST-DATA-05 pour les services configurés, le chemin réseau actif, le nombre d’utun et les interfaces de proximité observés.

| Point | Observation |
| --- | --- |
| Mac et emplacement réseau | macOS 27.2.1 (26B131), ARM64, emplacement `Automatic`. |
| Wi-Fi | `en0` allumé et actif, avec IPv4, IPv6 globale et IPv6 lien-local. `scutil --nwi` identifie en0 comme interface active. |
| Routes | Défaut IPv4 via `192.168.1.1` sur en0. Défaut IPv6 sur en0 et entrées de portée d’interface sur `utun0` à `utun5`. |
| Ethernet et USB | `en1` à `en4` et `bridge0` inactifs au relevé. Services configurés Wi-Fi, Thunderbolt Bridge, USB 10/100 LAN, USB 10/100 LAN 2 et iPhone USB. Les interfaces en6, en12 et en13 n’étaient pas présentes dans la liste effective. |
| Proximité | `awdl0` actif avec IPv6 lien-local. `llw0` a une IPv6 lien-local. `ap1` inactif et `nan0` sans adresse relevée. Bluetooth allumé. |
| Tunnels et relais potentiels | Les six utun portent des adresses IPv6 lien-local. Aucun VPN nommé dans `scutil --nc list`. Les propriétaires et le rôle effectif des utun restent indéterminés. Proxys système vides au relevé et forwarding IPv4/IPv6 à 0. |
| DNS | Résolveur IPv4 via le routeur `192.168.1.1` et résolveur IPv6 via en0. |
| Boucle locale et services | `lo0` actif. Aucune écoute visible sur les ports DEV-MAC contrôlés. Aucune sonde applicative. |
| Préconditions opérateur | Le compte de la session figure dans le groupe `admin`. Cela ne démontre pas la capacité à authentifier et exécuter les commandes de restauration depuis le terminal local. Le plan TEST-DATA-05 est présent sur disque. Sa disponibilité pour l’opérateur hors ligne reste à confirmer. |

## Modifications, sondes et restauration

- **Modifications effectuées** — aucune. Wi-Fi, Bluetooth, services réseau, routes, DNS, pare-feu et Seatbelt n’ont pas été modifiés.
- **Sondes dynamiques** — non exécutées. Les refus IPv4, IPv6, LAN et DNS, l’absence de relais et de reconnexion, ainsi que le fonctionnement de loopback pendant la coupure restent à démontrer.
- **Interfaces résiduelles après coupure** — non observées, puisque la coupure n’a pas eu lieu. Le tableau décrit l’état connecté initial.
- **Restauration** — aucune restauration nécessaire. La procédure et sa vérification dynamique n’ont pas été exercées.
- Aucun émulateur, service IKBS ou navigateur de recette démarré. Aucune donnée ou modification applicative.

## Conditions de reprise

L’opérateur doit confirmer explicitement la fenêtre, sa présence devant le Mac, un terminal local utilisable hors ligne, le fonctionnement du clavier et du dispositif de pointage sans Bluetooth, l’acceptation de la coupure et l’absence de tâche critique dépendant du réseau. Il doit aussi confirmer les droits de restauration depuis ce terminal et l’accès hors ligne au plan. Effectuer la coupure et sa restauration depuis ce terminal local. Si le canal de pilotage dépend du réseau du Mac, ne pas l’utiliser pour déclencher la coupure.

Après confirmation, capturer l’état initial horodaté, consigner chaque changement réellement appliqué et exécuter les sondes TEST-DATA-05. Un utun ou un relais encore inexpliqué, une connectivité non locale, une reconnexion ou une preuve insuffisante impose l’arrêt et la restauration de l’état initial. Vérifier la restauration des réglages et de la connectivité avant de soumettre le résultat à réception.

**Verdict TEST-DATA-06 : BLOCKED. Réception humaine demandée avant reprise. FT-01/E1 et P3 restent BLOCKED. L1-C.3 reste FAIL. La production reste NON AUTORISÉE.**
