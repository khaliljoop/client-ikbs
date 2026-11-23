# IKBS — F01.3-D-R2 · Recette Chrome privilégiée

**Verdict fonctionnel · FAIL**

**Verdict de restauration · VERIFIED**

## Préflight et état de référence

Le préflight a vérifié Firestore Emulator sur `127.0.0.1:18081`, Auth Emulator sur `127.0.0.1:19099`, le projet `demo-ikbs-l1a`, Fastify local et Next.js sur `http://localhost:3000`. La réponse publique relayée par Next.js concordait avec celle du backend local.

La relecture Firestore correspondait à R1. Dans D1000001, `demo.admin` avait une appartenance `ORGANIZATION_ADMIN` active sans octroi direct et `demo.membre1` une appartenance `MEMBER` active avec `organization.read`. Aucun des deux n’avait de rôle personnalisé ou d’octroi global. D1000001 ne contenait aucune définition personnalisée. Une référence locale protégée a été sauvegardée sans mot de passe, jeton ni secret.

## Contrôles exécutés

- **Chrome** · affichage du menu, chargement du registre des rôles, sélection d’une permission délégable, création du rôle et affichage dans le tableau. Le catalogue Fastify a renvoyé HTTP 200 et exclu les permissions d’administration des rôles.
- **Chrome** · recherche de `demo.membre1`, sélection de son appartenance, attribution du rôle synthétique, confirmation après actualisation et retrait depuis le panneau. Le scénario a également vérifié l’affichage à 390 px.
- **Fastify** · auto-attribution refusée avec 403, suppression d’un rôle affecté refusée avec 409 `ORG_ROLE_IN_USE`, puis suppression de la définition inutilisée avec 204.
- **Fastify, même session de `demo.membre1`** · `members.write` a ouvert les données personnelles d’une fiche. Une modification de la définition a retiré ce droit à la requête suivante, puis une seconde l’a rétabli. Le retrait final de l’affectation a de nouveau fermé les données personnelles. `organization.read` est restée la seule permission effective du membre après retrait. La liste des membres est restée consultable.

## Restauration

Les octrois temporaires ont été limités à `roles.manage` et `roles.assign` sur l’appartenance de `demo.admin` à D1000001. Une relecture immédiate a confirmé leur présence et l’égalité des autres données sauvegardées.

Après la recette, la relecture Firestore a confirmé l’égalité complète entre l’état final et la référence pour les deux identités, les appartenances, les octrois, les affectations et les définitions. Les octrois directs de `demo.admin` sont de nouveau vides. L’octroi direct `organization.read` de `demo.membre1` est conservé. Aucun rôle ni affectation synthétique ne subsiste.

Après restauration, Chrome a confirmé le masquage du menu et les refus 403 sur l’annuaire, le catalogue, les rôles et les affectations avec `demo.admin`. La liste et une fiche Membres étaient accessibles. Le contrôle inter-organisations est resté refusé.

## Anomalie fonctionnelle

La modification complète depuis le formulaire Chrome n’a pas été confirmée. Lors de la dernière tentative, la sonde n’a pas constaté la nouvelle valeur du champ Nom après saisie. La cause n’a pas été isolée. Une requête PATCH envoyée depuis la session Chrome a ensuite modifié le nom, la description et les permissions afin de poursuivre les contrôles d’affectation et de révocation. Cela valide le traitement Fastify. La persistance des changements de nom et de description effectués depuis le formulaire reste à vérifier.
