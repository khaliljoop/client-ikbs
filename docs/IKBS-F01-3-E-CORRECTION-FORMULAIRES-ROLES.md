# IKBS — F01.3-E · Correction des formulaires de rôles

## Causes et correction

La reproduction avec `demo.admin` dans D1000001 a reçu un **POST 201** avec l’identifiant, le code et le nom attendus. Les GET de la liste et du catalogue suivants ont reçu **200**. Le rôle était enregistré et le tableau se rafraîchissait, mais le popup restait monté sur « Enregistrement… ». La console Chrome a signalé trois avertissements de clé dupliquée au cours du parcours.

`RoleWorkspace` rendait les panneaux frères `RoleDefinitions` et `RoleAssignments` avec la même clé `identityId:organizationId`. Le doublon venait de cette paire de composants, indépendamment des lignes de l’annuaire ou des rôles Firestore. Les panneaux ont maintenant des clés stables distinctes, préfixées par `definitions:` et `assignments:`. Un formulaire d’édition est identifié par le rôle ouvert, distinct du formulaire de création.

Le formulaire réinitialise son état d’enregistrement à la fin de la requête et transmet la réponse confirmée au panneau. Celui-ci ferme le popup, répercute la réponse dans le tableau et affiche la notification, puis relit la liste. Si la relecture échoue, la ligne confirmée reste visible et l’action Réessayer relance seulement la lecture. Les refus de mutation conservent la saisie et permettent de réessayer. Le verrou existant empêche deux mutations simultanées.

L’édition reprend le nom, la description et les permissions du rôle sélectionné. Le code demeure immuable et les permissions inchangées sont omises du PATCH. Aucun changement des composants partagés, de Fastify ou de la politique RBAC n’a été nécessaire.

## Fichiers modifiés

- `src/features/roles/components/RoleWorkspace.tsx`
- `src/features/roles/components/RoleForm.tsx`
- `tests/auth-browser.test.mjs`
- Ce rapport

## Recette et état final

Dans Chrome sur `http://localhost:3000/espace/D1000001/roles`, avec les droits existants de `demo.admin`, la création a envoyé **un seul POST**. Le popup s’est fermé, la notification s’est affichée et la ligne était visible sans rechargement. Dans l’édition, le nom et la description ont été modifiés puis sauvegardés via le bouton. Le PATCH émis par le formulaire ne contenait que ces deux champs. Le popup s’est fermé, les nouvelles valeurs sont restées visibles après rechargement et les permissions ont été préservées. Aucun avertissement de clé dupliquée n’a été détecté.

Le rôle synthétique a été supprimé depuis l’interface. La relecture de Firestore Emulator `demo-ikbs-l1a` confirme l’égalité des identités, octrois, affectations et définitions avec la référence du jour, y compris le rôle préexistant `admintest`. Aucune donnée de recette ne subsiste.

## Tests automatisés

- `node --test tests/auth.test.mjs tests/roles.test.mjs` · **13 tests réussis**.
- `IKBS_TEST_CHROME=… node --test tests/auth-browser.test.mjs` · **1 scénario réussi** dans une copie Next.js temporaire. Il couvre le rejet du POST, la rupture de transport, la double soumission, l’échec puis la reprise de la lecture après un POST réussi, la notification et la fermeture, le préremplissage, le code en lecture seule, le rejet puis le succès du PATCH, la conservation des permissions, le rechargement et l’absence de clé dupliquée. Le serveur de réponses de test était local et sans accès Firebase.
- TypeScript, ESLint ciblé et `npm run build -- --webpack` réussis.

## Verdicts

| Contrôle | Verdict |
| --- | --- |
| Création | **PASS** |
| Édition | **PASS** |
| Clés React | **PASS** |
| Tests | **PASS** |
| Nettoyage | **VERIFIED** |
