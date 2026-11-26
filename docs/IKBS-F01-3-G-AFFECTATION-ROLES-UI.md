# IKBS — F01.3-G · Affectation des rôles dans Next.js

## Diagnostic et correction

`RoleWorkspace` affichait déjà le panneau autorisé par `roles.assign`. Pour un administrateur disposant aussi de `roles.manage`, le panneau venait après le tableau des rôles personnalisés, sans accès direct. La commande « Attribuer » dépendait de la sélection d’une appartenance et de la disponibilité d’un rôle. Ces conditions expliquent pourquoi l’action pouvait passer inaperçue, en particulier lorsque le catalogue était vide.

- `RoleWorkspace.tsx` ajoute « Affecter des rôles » en haut de page lorsque les deux sections sont visibles. Le lien vise la section des affectations. Avec `roles.assign` seul, le panneau suit directement le titre.
- `RoleAssignments.tsx` indique qu’il faut sélectionner une appartenance active. Si le catalogue est vide, un lien vers les rôles personnalisés est proposé aux titulaires de `roles.manage`. Les rôles attribués, la confirmation du retrait et le retour d’erreur restent dans la section de l’appartenance sélectionnée.
- L’annuaire Fastify fournit les appartenances actives dans l’organisation. Les mutations utilisent `identityId` dans les routes existantes et restent soumises au contrôle Fastify. Les clés d’affichage utilisent les identifiants stables, et le verrou de soumission existant protège la mutation.

## Vérifications frontend

| Contrôle | Résultat |
| --- | --- |
| `node --test tests/auth.test.mjs tests/roles.test.mjs` | 13 tests réussis |
| `IKBS_TEST_CHROME=… node --test tests/auth-browser.test.mjs` | Scénario Chrome avec réponses synthétiques réussi |
| `tsc --noEmit --incremental false` | Réussi |
| ESLint ciblé sur les deux composants et le test navigateur | Réussi |
| `npm run lint` | 3 erreurs historiques et 14 avertissements. Aucune erreur sur les fichiers modifiés. |
| `npm run build -- --webpack` | Réussi |
| `git diff --check` | Réussi |

La couverture navigateur inclut le lien d’accès, l’absence d’auto-attribution, le choix d’un rôle, l’attribution, le retrait, la double soumission, le 403, l’exclusion d’une appartenance inactive, l’isolation et le retrait de l’accès dès actualisation des capacités. Aucun avertissement de clés React dupliquées n’a été observé.

Les erreurs de lint globales se trouvent dans `data-table-demo/page.tsx:352` (`react/no-unescaped-entities`), `organisations/page.tsx:103` et `OrganizationManagement.tsx:501` (`react-hooks/set-state-in-effect`).

## Recette Chrome intégrée et intégrité

La recette finale a utilisé Chrome 158 avec un profil jetable, Next.js en HTTP loopback (18462), Fastify (18461), Auth Emulator (19098) et Firestore Emulator (18082), tous sur `127.0.0.1`. Le projet était `demo-ikbs-l1a`, sans import ni identifiants réels. Le préflight a contrôlé les ports, le projet, les destinations et le 401 anonyme à travers Next.js. Les processus de service étaient soumis à un profil Seatbelt refusant la sortie IP hors boucle locale. Cette recette fonctionnelle ne qualifie pas le confinement réseau de Chrome.

- Dans l’organisation synthétique `G1000001`, l’appartenance active `ORGANIZATION_ADMIN` de `demo.admin` ne portait aucun octroi direct. `/auth/me` a renvoyé `roles.manage` et `roles.assign`, sans permission globale.
- Chrome a vérifié le menu, le lien vers les affectations, la sélection de `demo.membre1`, l’état sans rôle et l’absence de l’appartenance inactive. Fastify a renvoyé 404 pour l’appartenance inactive et l’annuaire de l’autre organisation, puis 403 pour l’auto-attribution et pour la consultation de l’annuaire par un membre sans droit d’affectation.
- Après sauvegarde de l’état, le rôle synthétique a été attribué puis retiré via l’interface. Chrome a observé un seul POST malgré le double clic, puis un seul DELETE. La permission `members.write` est apparue puis a disparu à la relecture du profil avec la même session membre. L’affichage a été vérifié à 390 px.
- Après retrait, les définitions, octrois et affectations relus via les repositories Firestore correspondaient à la référence. Le rôle synthétique et les sessions ont été éliminés avec l’arrêt des instances jetables. Les ports de recette ont été libérés. Aucune écriture n’a visé `D1000001`.

La tentative HTTPS locale a bloqué sur la navigation Chrome. Une tentative HTTP a également révélé une course dans l’automatisation du formulaire de connexion avant hydratation. La recette finale a authentifié les comptes via le POST Fastify depuis Chrome et a réalisé les deux mutations de rôle depuis l’interface.

## Verdicts

| Contrôle | Verdict |
| --- | --- |
| Diagnostic | PASS |
| Interface | PASS |
| RBAC | PASS |
| Tests | PASS |
| Recette Chrome | PASS |

F01.3-G est soumis à validation humaine.
