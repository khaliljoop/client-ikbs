# IKBS — F02-A0 · Audit et conception du module Commissions

## 1. Synthèse exécutive

Flutter affiche une entrée « Commissions » dans le profil membre, avec une action vide. Un modèle `Responsable` et une référence de collection `responsable` existent. Les sources examinées ne démontrent aucun lien entre ces éléments ni de parcours complet de commission. Fastify ne comporte pas de module Commissions. Next.js possède une URL prévue et des mentions d’interface sans données de commission.

**PROPOSÉE** · Commencer par un registre privé par organisation, puis ajouter les affectations de fiches Membres. Concevoir les fonctions et mandats après arbitrage. Cette séquence met à disposition un parcours vérifiable avant d’introduire des règles temporelles ou de responsabilité.

Les mentions **CONFIRMÉE_PAR_CODE**, **PROPOSÉE** et **À_VALIDER** distinguent les observations statiques, les choix de conception recommandés et les arbitrages métier. Les chemins Flutter et Fastify sont relatifs à leurs dépôts respectifs.

## 2. Inventaire Flutter

| Élément | Constat et référence | Provenance |
| --- | --- | --- |
| Écran | `lib/screens/userProfil.dart:385-397` affiche la carte « Commissions » avec une flèche. Le `onTap` a un corps vide. La carte suit le bloc conditionnel des cotisations, qui se termine ligne 383. Son affichage ne démontre aucune autorisation de consulter une commission. | **CONFIRMÉE_PAR_CODE** |
| Modèle Responsable | `lib/models/admin/responsable.dart:3-28` définit une entité annotée avec `key` comme clé primaire et les chaînes `scode`, `mid`, `date`. La sérialisation reprend ces champs. Le commentaire « 3 jours » sur `date` n’établit aucune règle de mandat. Le modèle ne comporte ni identifiant de commission ni fonction. | **CONFIRMÉE_PAR_CODE** |
| Firestore | `lib/services/firebase/collection.dart:19` déclare la collection racine `responsable`. Aucun appel de lecture ou d’écriture de cette référence, ni collection de commissions, n’a été relevé dans les sources ciblées. Le contenu déployé et les données historiques n’ont pas été consultés. | **CONFIRMÉE_PAR_CODE** |
| Relations voisines | `lib/services/firebase/firebaseservice.dart:289` résout un profil utilisateur via `scode` et `mcode`. La méthode ligne 594 lit les fiches de `services/{scode}/membres`. Ce sont des relations service–utilisateur ou service–membre. Aucun rattachement à une commission n’est observé. | **CONFIRMÉE_PAR_CODE** |
| Parcours et validations | Aucune navigation vers un écran de commission, aucune opération CRUD ni validation de code, de fonction, d’affectation ou de mandat n’a été identifiée. La mention « responsable service » dans `lib/screens/forgetPass.dart:353` appartient à la récupération de compte. Aucune règle de consultation ou de modification de commission n’a été démontrée. | **CONFIRMÉE_PAR_CODE** |
| Incertitude historique | Le sens fonctionnel de `Responsable.date`, l’usage réel de la collection et l’existence éventuelle de données de commission dans une autre source restent à confirmer avec le métier. | **À_VALIDER** |

## 3. Fastify · socle réutilisable

| Élément | État et réutilisation envisagée |
| --- | --- |
| Structure | **CONFIRMÉE_PAR_CODE** · `src/app/app.ts:95-117` protège et monte les routes métier sous `/api/v1`. `src/modules/` contient organisations, membres, demandes, auth et autorisation. Aucun module Commissions n’a été relevé. **PROPOSÉE** · Adopter les mêmes séparations domaine, application, infrastructure et présentation dans un module dédié. |
| Périmètre et identifiants | **CONFIRMÉE_PAR_CODE** · `src/modules/authorization/application/authorization.ts:60-69` vérifie l’appartenance active et l’organisation active. L’adaptateur Membre résout ses documents sous la collection d’organisation, puis `members`. `auth` conserve une identité distincte dont `memberId` peut être nul. **PROPOSÉE** · Utiliser le véritable identifiant d’organisation comme périmètre et le `memberId` métier comme référence d’affectation. |
| Droits | **CONFIRMÉE_PAR_CODE** · `authorization/domain/policy.ts` distingue les droits globaux, les droits locaux, les rôles intégrés et le catalogue de délégation. `authorization.ts:101-108` relit les rôles personnalisés. Les fonctions métier éventuelles ne doivent pas être confondues avec ces rôles d’accès. |
| Validation et transactions | **CONFIRMÉE_PAR_CODE** · `authorization/presentation/business-access.ts:53-90` contrôle la session, le cache, le CSRF et réévalue les droits dans l’unité de travail. `src/shared/infrastructure/firebase-transaction.ts` rattache les lectures et écritures à cette transaction. Les routes Membres et Rôles valident leurs entrées et utilisent des DTO dédiés. **PROPOSÉE** · Réutiliser ces points d’entrée et leurs erreurs standardisées. |
| Tests | **CONFIRMÉE_PAR_CODE** · `tests/integration/members/directory.http.test.ts`, `tests/integration/authorization/role-assignment.http.test.ts` et `authorization.firebase.test.ts` fournissent des exemples de contrôle inter-organisations, de mutation et de persistance. **PROPOSÉE** · Reprendre les fixtures, les adapters mémoire et Firestore et le préflight d’émulateur jetable. |

**CONFIRMÉE_PAR_CODE** · Le domaine Membre distingue `ACTIVE`, `INACTIVE`, `SUSPENDED` et `ARCHIVED`. L’archivage membre est terminal et en préserve l’identifiant (`src/modules/members/domain/entities/member.ts:17-24`). Ce comportement F01 constitue une contrainte pour F02.

## 4. Next.js · points d’intégration

- **CONFIRMÉE_PAR_CODE** · `src/config/routes.ts:36-39` réserve `/espace/[organizationCode]/commissions`. Aucune page correspondante ni entrée dans `src/config/organization-menu.ts` n’a été relevée. La fiche publique propose un bloc statique (`src/app/(public)/organisations/[organizationCode]/page.tsx:249-296`). `/data-table-demo` contient une démonstration de sélecteur, sans service métier.
- **CONFIRMÉE_PAR_CODE** · Le layout local assemble `SessionGate`, `WorkspaceAccess` et `OrganizationShell`. Le menu et l’espace emploient les capacités de Fastify. `src/lib/api/client.ts` envoie les requêtes en même origine, applique `no-store` et fournit l’en-tête de mutation. Le dépôt contient `DataTable`, `FormModal`, `ConfirmModal` et les notifications Toast.
- **PROPOSÉE** · Ajouter l’entrée au menu local après raccordement d’une page protégée. Utiliser le registre Membres comme source de fiches éligibles et le client API existant pour les appels. La visibilité du menu reflète la session, tandis que l’API décide de chaque accès.

## 5. Proposition de modèle métier

| Objet | Proposition | Provenance |
| --- | --- | --- |
| Commission | Une organisation privée propriétaire obligatoire. UUID stable, code normalisé unique par organisation, nom obligatoire, description facultative, état et dates techniques. Code immuable après création et réservé après archivage. | **PROPOSÉE** |
| Cycle de vie | Commission active puis archivée. L’archive conserve les données et bloque les nouvelles affectations. Consultation historique par un lecteur habilité. Une commission peut être créée vide. | **PROPOSÉE** |
| Réactivation | Commencer avec un archivage terminal, cohérent avec le modèle Membre. Valider explicitement si une commission doit pouvoir être réactivée, et avec quel devenir pour ses affectations. | **À_VALIDER** |
| Participation | Une fiche Membre peut participer à plusieurs commissions de son organisation. Une nouvelle participation exige une fiche active et une commission active. Une seule participation ouverte par couple. Conserver les dates de début et de clôture, sans suppression physique de l’historique. | **PROPOSÉE** |
| Membre archivé ou indisponible | Conserver les références existantes. L’éligibilité opérationnelle dépend de l’état actuel de la fiche. Un membre inactif, suspendu ou archivé reste visible dans l’historique et ne doit plus être considéré comme actif dans la commission. F02 lit l’état de la fiche, ce qui évite une cascade d’écriture dans F01. Validité de la réactivation d’une participation lors du retour à l’état actif à arbitrer. | **PROPOSÉE** pour le calcul et la conservation, **À_VALIDER** pour le retour à l’état actif |
| Fonction et responsabilité | Un modèle `CommissionResponsibility` pourrait relier une participation à une fonction et à un intervalle. Une responsabilité métier ne confère aucun droit RBAC. Fixer le catalogue, le nombre de responsables et de fonctions simultanées avant d’implémenter leur affectation. | **PROPOSÉE** pour le lien, **À_VALIDER** pour les cardinalités et le catalogue |
| Mandat | Début requis et fin facultative à arbitrer. Si un intervalle est retenu, recommander des dates civiles ISO et une fin exclusive, strictement postérieure au début. Le renouvellement ouvre un nouvel intervalle et conserve l’ancien. Bloquer les chevauchements selon les contraintes de la fonction et de la personne approuvées par le métier. | **PROPOSÉE** pour la convention, **À_VALIDER** pour les obligations et chevauchements |

## 6. Proposition de modèle de données et transactions

**PROPOSÉE** · Créer un port de repository indépendant de Firebase, avec adaptateurs mémoire et Firestore. Stocker les nouvelles données dans un espace dédié, par exemple `ikbs_commissions_v1/{organizationId}/commissions/{commissionId}`. Utiliser un document d’unicité `codes/{normalizedCode}` au niveau de l’organisation et des sous-collections `participations/{participationId}` par commission. Un index document par `memberId` identifie la participation ouverte et permet de sérialiser les créations concurrentes pour le même couple. Les documents conservent l’UUID de l’organisation et de la fiche. Un futur historique de responsabilités référence la participation et la fonction approuvée.

**PROPOSÉE** · Réserver le code et écrire la commission dans la même transaction. Pour affecter un membre, lire l’organisation, la commission, la fiche et l’index d’affectation ouvert dans l’unité de travail avant les écritures. Pour retirer, clôturer la participation et libérer l’index atomiquement. Une mutation d’archive ou d’affectation lit la commission dans la transaction afin de traiter la course avec l’archivage. Utiliser un contrôle de version pour les modifications concurrentes du profil d’une commission. Conserver l’état historique lorsque le lien vers une fiche ne peut plus être résolu.

**À_VALIDER** · Déterminer si l’archivage ferme implicitement les participations à une date métier ou les fige telles quelles dans l’historique. Déterminer les champs d’audit à conserver et leur durée de rétention. Aucune migration ni correspondance de codes historiques n’est présumée.

## 7. Proposition RBAC

| Permission locale proposée | Périmètre | Provenance |
| --- | --- | --- |
| `commissions.read` | Liste, détail, participants et archives autorisées dans l’organisation. Réponse limitée aux informations métier nécessaires. | **PROPOSÉE** |
| `commissions.manage` | Création, modification et archivage des commissions. | **PROPOSÉE** |
| `commissions.members.manage` | Affectation et retrait des fiches Membres de la même organisation. | **PROPOSÉE** |
| `commissions.responsibilities.manage` | Attribution et clôture d’une responsabilité après validation métier. À introduire seulement lors de cette tranche. | **PROPOSÉE** |

**PROPOSÉE** · Réutiliser le contrôle d’organisation active, d’appartenance active et de `organization.read`. Une mutation exige aussi le droit métier de mutation et la capacité de lecture de la commission. Résoudre chaque identifiant par son périmètre côté serveur. Consommer l’autorisation calculée pour l’identité connectée. La référence métier `memberId` n’entre jamais dans la décision RBAC.

**À_VALIDER** · Décider quelles permissions seront natives des administrateurs actifs, lesquelles seront déléguables via les rôles personnalisés et si la lecture des archives doit recevoir une permission distincte. Aucun octroi global ou automatique n’est supposé dans l’audit.

## 8. Routes API envisagées

Toutes les routes ci-dessous sont **PROPOSÉES** sous `/api/v1/organizations/:id`.

| Route | Usage |
| --- | --- |
| `GET /commissions` | Liste paginée avec recherche et filtre d’état. |
| `POST /commissions` | Création avec code, nom et description éventuelle. |
| `GET /commissions/:commissionId` | Détail privé. |
| `PATCH /commissions/:commissionId` | Modification des champs autorisés avec contrôle de version. |
| `PATCH /commissions/:commissionId/status` | Archivage et validation de la transition, selon décision. |
| `GET /commissions/:commissionId/members` | Participations courantes ou historiques, avec DTO minimaux. |
| `POST /commissions/:commissionId/members` | Nouvelle participation pour un `memberId` éligible. |
| `PATCH /commissions/:commissionId/members/:participationId/status` | Clôture de la participation. |
| `GET /commissions/:commissionId/responsibilities`, `POST` et clôture par identifiant | Réservées à la tranche des responsabilités, après arbitrage. |

**PROPOSÉE** · Conserver 401 sans session, 403 pour capacité insuffisante avec une organisation autorisée, 404 pour ressource inconnue ou masquée par le périmètre, et 409 pour doublon, transition ou version incohérente. Appliquer la validation stricte et les protections F01 à chaque route.

## 9. Écrans et scénarios de tests

- **PROPOSÉE** · Liste locale à l’URL réservée avec recherche, état d’archives et création selon les capacités. Détail à `/espace/[organizationCode]/commissions/[commissionId]` avec profil et participations. Formulaire de modification, confirmation d’archivage et sélecteur de fiches éligibles. Onglet Responsabilités uniquement quand le module correspondant existe. Le bloc public reste hors de la première tranche.
- **PROPOSÉE** · Domaines et repositories : normalisation, code identique permis dans deux organisations et refusé dans la même, transitions, immutabilité et conservation des données. Deux créations concurrentes du même code ou du même couple doivent donner une seule réussite. Tester aussi archive contre affectation et indisponibilité de fiche pendant une mutation.
- **PROPOSÉE** · API et RBAC : 401/403/404, entrée malformée, refus CSRF, absence de données d’une autre organisation, permis et refus par rôle, suspension de l’appartenance et révocation avec la même session.
- **PROPOSÉE** · Parcours Next.js : visibilité du menu, accès direct, création, validation, refus de doublon, archivage, affectation et retrait, conservation de l’historique. Vérifier dans Chrome avec données synthétiques après autorisation. Rejouer les tests F01. Les responsabilités futures nécessiteront des tests de bornes, renouvellement et chevauchement.

## 10. Risques et contraintes

| Risque | Réponse envisagée et provenance |
| --- | --- |
| Doublons et concurrence | **PROPOSÉE** · Documents d’unicité et lectures transactionnelles, notamment lorsque deux requêtes voient initialement un registre vide. |
| Accès croisé | **PROPOSÉE** · IDs résolus sous la même organisation, tests de substitution d’identifiants et données minimales dans les listes. |
| Suppression ou archivage d’un membre | **CONFIRMÉE_PAR_CODE** · F01 archive les fiches et conserve leurs IDs. **PROPOSÉE** · Conserver les références et signaler un lien indisponible, sans modifier le cycle de vie F01. |
| Conservation de l’historique | **PROPOSÉE** · Clôture datée des liens et conservation des références. **À_VALIDER** · Rétention, visibilité et données historiques à afficher. |
| Commission sans responsable | **PROPOSÉE** · Autoriser la création du registre avant la désignation. **À_VALIDER** · Éventuel minimum métier à imposer ultérieurement et conséquences du départ du dernier responsable. |
| Intervalles incohérents | **PROPOSÉE** · Règle de bornes explicite et contrôle dans la transaction. **À_VALIDER** · Fuseau ou calendrier de référence, dates rétroactives et cumul de fonctions. |
| Migration historique | **CONFIRMÉE_PAR_CODE** · Les traces Flutter ne démontrent pas un schéma de commissions ni un mapping vers les UUID de la plateforme. **PROPOSÉE** · Exiger un inventaire distinct, un mapping explicite de `scode` et `mid`, des règles de résolution des collisions et une recette sur données synthétiques avant tout projet de migration. |

## 11. Décisions métier à valider

| Décision | Recommandation soumise à arbitrage | Provenance |
| --- | --- | --- |
| Propriété et code | Organisation obligatoire, code immuable réservé après archivage. Choisir format, longueur et génération ou saisie manuelle. | **À_VALIDER** |
| Visibilité et archivage | Registre privé, archivage terminal au départ. Trancher la réactivation et la visibilité publique éventuelle. | **À_VALIDER** |
| Participations | Plusieurs commissions par fiche active, historique conservé. Décider du retour dans le registre actif après réactivation de la fiche et du sort des liens lors de l’archivage d’une commission. | **À_VALIDER** |
| Fonctions | Fixes ou configurables. Décider du nombre de responsables, des cumuls et des remplacements. | **À_VALIDER** |
| Mandats | Champs obligatoires, règles de renouvellement, fin exclusive, rétroactivité et chevauchements autorisés. | **À_VALIDER** |
| Accès | Lecteurs, créateurs, gestionnaires des participations et des responsabilités. Valider octrois natifs, délégation et accès aux archives. | **À_VALIDER** |
| Historique legacy | Confirmer auprès du métier le sens de `Responsable` et l’existence d’une source de données exploitable. Toute reprise nécessite une mission distincte. | **À_VALIDER** |

## 12. Découpage proposé

| Mission | Travail envisagé et précondition | Provenance |
| --- | --- | --- |
| F02-A1 | Registre backend, contrats, persistance et RBAC après validation du périmètre, du code et du cycle de vie. | **PROPOSÉE** |
| F02-A2 | Liste et fiche privées Next.js, formulaires et recette du registre sur émulateur après validation A1. | **PROPOSÉE** |
| F02-A3 | Participations et historique, backend puis interface, après arbitrage d’éligibilité et des conséquences d’archivage. | **PROPOSÉE** |
| F02-A4 | Fonctions, responsabilités et mandats après validation de la politique temporelle et des cardinalités. | **PROPOSÉE** |
| F02-A5 | Recette intégrée de la parité décidée, contrôles de non-régression F01 et réception humaine. | **PROPOSÉE** |

F02-A0 s’arrête à l’analyse des sources et à ce rapport. Aucun service ni test dynamique n’a été lancé. Le passage à F02-A1 attend la validation humaine des décisions structurantes.
