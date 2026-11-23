# IKBS — FT-01/E1-B · Qualification du navigateur isolé

**22 novembre 2026 — BLOCKED.** Le diagnostic reproduit un refus d’application d’un second profil Seatbelt, sans Chrome ni socket réseau. Une VM de recette sans périphérique réseau offre une voie pour conserver le sandbox natif du navigateur et borner les communications à la boucle locale. Aucune VM ARM64 de recette prête n’a été identifiée dans les emplacements locaux examinés.

## Diagnostic E1

Chrome 158.0.8127.36 est présent. E1 avait échoué sur une page `data:`, avant toute négociation TLS. Les deux échecs sont distincts. [Rapport E1](IKBS-FT01-E1-DEMARRAGE-CONFINEMENT.md)

| Opération | Preuve | Conclusion |
| --- | --- | --- |
| Socket Unix d’instance | E1, sortie 21. Le `bind()` de `…/com.google.Chrome.<instance>/SingletonSocket` a rendu `EPERM`. | Le premier refus concerne l’IPC local d’instance. E1 a autorisé uniquement le bind et la connexion sur ce motif. Les règles IP sont restées identiques. |
| Initialisation du sandbox interne | E1, sortie 133 avec l’exception Unix étroite. Les journaux contiennent `sandbox initialization failed: Operation not permitted` et `aperitif: Failed to initialize sandbox`. | Des auxiliaires ont atteint leur phase d’initialisation sandbox. Le diagnostic ne montre pas un refus de création de tous les processus ou une erreur TLS. |
| Cumul des profils Seatbelt | E1-B, `sandbox-exec` simple avec un profil minimal et `/usr/bin/true` a réussi. Le même appel placé sous le profil loopback E1 a échoué avant `true`, sortie 71, `sandbox-exec: sandbox_apply: Operation not permitted`. | Le refus se reproduit sans navigateur, sans socket Unix applicatif, sans résolution DNS et sans contrôle TLS. Il concerne l’application du profil interne dans l’environnement externe testé. |
| IPC Mach/XPC et services système | Les journaux E1 disponibles ne désignent aucun service Mach/XPC dont l’autorisation résoudrait le refus. Les avertissements Crashpad sont observés pendant l’échec. | Aucun élargissement de droits IPC ou système n’est justifié. La cause noyau précise du refus Chrome reste non instrumentée. |

Chromium décrit un profil macOS par type de processus et la transmission des paramètres de sandbox aux auxiliaires. La reproduction avec `true` appuie le diagnostic de cumul de profils pour cette topologie. Elle ne démontre pas que tous les modes d’isolation système de macOS sont incompatibles avec Chrome. [Sandbox macOS Chromium](https://chromium.googlesource.com/chromium/src/+/HEAD/sandbox/mac/README.md) · [Conception du sandbox Chromium](https://chromium.googlesource.com/chromium/src/+/HEAD/sandbox/mac/seatbelt_sandbox_design.md)

## Stratégies

| Option | Évaluation | Verdict |
| --- | --- | --- |
| A. Chrome natif sous Seatbelt adapté | L’exception sur le seul socket Unix d’instance couvre le premier refus. Le profil conserve la limite IP loopback et laisse les autres sockets Unix de relais hors de l’exception. L’échec d’application du profil interne persiste. Aucune permission étroite et documentée n’a été identifiée pour résoudre ce second échec sans compromettre les exigences. | BLOCKED sur l’hôte actuel. |
| B. Chrome natif dans une VM de recette sans carte réseau | La coupure est imposée par l’hyperviseur et vaut pour les descendants indépendamment de leur sandbox. Utiliser la console locale de la VM, une image jetable déjà approvisionnée et uniquement la boucle locale du guest. Exclure NAT, pont, réseau hôte, redirections de ports et tout canal partagé capable de relayer des requêtes. | Stratégie recommandée. VirtualBox est présent mais aucune configuration `.vbox` n’a été trouvée sous le dossier par défaut à la profondeur examinée. Aucun guest qualifié ni disponibilité de Chrome dedans n’ont été démontrés. |
| C. Autre navigateur avec sandbox natif | Safari est installé. Aucune preuve ne qualifie sur cet hôte son isolation réseau indépendante, son profil jetable et sa confiance TLS dédiée. Chromium ou un autre navigateur dans la VM reste envisageable après accord et sous les mêmes critères. | Comparaison documentaire uniquement. |

Un proxy seul laisse ouverte la question des autres chemins de sortie, y compris les processus auxiliaires, DNS et IPv6. Il ne satisfait pas le critère E1-B. La configuration de VM recommandée expose zéro périphérique réseau et aucun relais hôte. Apple documente une configuration sans périphérique réseau et VirtualBox documente le mode sans réseau. La présence locale de VirtualBox ne démontre pas la disponibilité d’une VM ARM64 conforme. [Virtualization Framework](https://developer.apple.com/documentation/virtualization/vzvirtualmachineconfiguration/networkdevices) · [Manuel VirtualBox](https://download.virtualbox.org/virtualbox/7.0.16/UserManual.pdf)

## Vérifications effectuées et limites

- Lecture du rapport, du profil et des journaux E1. Version Chrome relevée dans le bundle, sans relancer le navigateur.
- Sonde Seatbelt simple puis imbriquée. Profil minimal interne `(version 1) (allow default)` appliqué uniquement à `true`, avec et sans le profil loopback externe E1. Environnement vidé, HOME et TMPDIR temporaires. Nettoyage du dossier de diagnostic à la sortie.
- Inventaire en lecture seule des applications et de l’emplacement VirtualBox par défaut. Aucun démarrage ni changement de configuration.
- Ports 19099, 18081, 18300 et 18301 sans écoute observée. Aucun serveur HTTPS de contrôle ni navigateur lancé en E1-B, faute d’environnement permettant les deux formes de confinement. Aucune preuve dynamique Chrome d’egress IP/DNS, de comportement des descendants ou d’acceptation TLS n’a donc été obtenue.
- Les sondes IP parent/enfant Node de E1 restent des preuves pour ces processus seulement. La validation OpenSSL du certificat E1 reste une validation du certificat seul. Aucun artefact TLS nouveau généré et aucune clé ajoutée à un magasin de confiance.

## Conditions pour reprendre E1

1. Soumettre à réception un guest jetable adapté, approvisionné hors ligne à partir d’artefacts approuvés. Démontrer la configuration sans NIC ni canal de relais et vérifier dans le guest les interfaces, routes IPv4/IPv6, configuration de résolution et écoutes. Conserver le relevé avant, pendant et après le test.
2. Démarrer d’abord uniquement Chrome et un serveur HTTPS de contrôle lié à `127.0.0.1` dans ce même guest. Utiliser un compte utilisateur et un profil jetables, le sandbox natif normal et aucun drapeau de désactivation de sécurité. Relever `chrome://sandbox` si disponible sur le guest, la ligne de commande et la filiation navigateur, renderer et service réseau. Contrôler leur appartenance au même guest isolé.
3. Vérifier depuis le navigateur le succès loopback et les échecs pour des adresses de documentation IPv4 et IPv6, puis pour un nom réservé non configuré localement. Corréler les résultats navigateur avec les preuves réseau du guest. Confirmer l’absence de route vers un résolveur externe et d’egress DNS, y compris via HTTPS. Vérifier que les descendants relèvent de la même barrière hyperviseur. Un simple échec de navigation ou un NXDOMAIN ne suffit pas.
4. Créer une CA et un certificat serveur éphémères avec SAN IP `127.0.0.1` dans le guest de contrôle. Pour un guest Linux, prévoir une base NSS dans le HOME dédié au seul utilisateur jetable Chrome, selon la version, sans changement du magasin système ou hôte. Confirmer d’abord le refus de la chaîne non approuvée, puis la réussite avec la CA éphémère et le rejet d’une autre CA ou d’un SAN incorrect, sans ignorer les erreurs TLS. Conserver uniquement les éléments expurgés et empreintes. Arrêter les processus de contrôle et supprimer profil, base NSS, clés et état jetable. [Gestion des certificats Chromium Linux](https://chromium.googlesource.com/chromium/src.git/+/master/docs/linux/cert_management.md)
5. Reprendre E1 uniquement après réception des preuves navigateur et autorisation distincte. Une VM sans carte réseau a sa propre boucle locale. Les quatre services doivent donc partager ce guest avec Chrome dans cette variante, avec leurs ports et gardes E1 inchangés. Leur disponibilité ARM64 et celle des dépendances doivent être contrôlées avant cette reprise.

**FT-01/E1 reste BLOCKED. P3 reste BLOCKED. L1-C.3 reste FAIL. La production reste NON AUTORISÉE. Réception humaine demandée pour la stratégie de VM isolée.**
