# IKBS — F01.2-B · Fiche membre enrichie

## Champs et fonctionnalités

- La fiche affiche un avatar à initiales, le nom, le code immuable, le statut et une section responsive pour les informations personnelles. Le formulaire prérempli permet de modifier le prénom, le nom, l’email, le téléphone, l’adresse et le sexe. Les champs facultatifs peuvent être effacés. La fiche est actualisée après l’enregistrement.
- Les formulaires et écrans Flutter ciblés confirment ces champs. Flutter exige un téléphone et une adresse à l’inscription, accepte un email facultatif et propose les valeurs homme et femme. IKBS conserve les contrats F01.2-A et les fiches déjà créées. L’email reste obligatoire et unique dans l’organisation. Le téléphone, l’adresse et le sexe restent facultatifs. Si le téléphone est saisi, il suit la règle sénégalaise observée dans Flutter, soit neuf chiffres avec un préfixe 70, 75, 76, 77 ou 78. La pièce d’identité, la géolocalisation et les champs présents uniquement dans le modèle ne sont pas exposés.
- Le détail personnel est transmis uniquement aux titulaires de `members.write` dans l’organisation. La liste et le détail accessibles en lecture seule conservent les champs F01. La création et la modification réutilisent les routes, le contrôle CSRF, les transactions et les adaptateurs existants.

## Fichiers modifiés

- API_IKBS · `src/modules/authorization/application/authorization.ts`, `src/modules/members/domain/entities/member.ts`, `src/modules/members/application/use-cases/update-member.ts`, `src/modules/members/presentation/member.routes.ts`, `tests/integration/members/directory.http.test.ts`.
- client-ikbs · `src/lib/api/members.ts`, `src/features/members/components/MemberDirectory.tsx`, `src/features/members/components/MemberForm.tsx` et ce rapport.

## Vérifications effectuées

- **227 tests backend sur 44 fichiers**, avec Firestore Emulator jetable `demo-ikbs-l1a` sur `127.0.0.1:18082`, éteint après la suite. Couverture du détail autorisé, des champs facultatifs, des formats invalides, de l’unicité concurrente de l’email, du refus inter-organisations, de la projection sans coordonnées en lecture seule et des parcours F01/F01.2-A.
- Deux tests ciblés avec le repository mémoire, huit tests frontend de session, TypeScript backend et frontend, TypeScript des tests backend et ESLint ciblé réussis.
- **Chrome avec `demo.admin`** sur la fiche synthétique `MBR-2026-000001`. Préremplissage de l’email, erreur sur téléphone invalide, enregistrement des quatre champs personnels, relecture après rechargement et vérification de l’absence de débordement horizontal à 390 px. Seule cette fiche synthétique existante a été enrichie dans l’environnement de démonstration.

## Limite

Le téléversement est différé. Le code Fastify inspecté ne fournit aucun service de médias membres, endpoint multipart sécurisé ou mécanisme d’accès privé aux photos. Une future mission devra définir le stockage privé, l’autorisation par organisation, les formats et tailles admis, la vérification du contenu réel et la gestion du remplacement. La fiche affiche l’avatar par défaut.
