# L1-C.3 — Recette intégrée frontend

## Configuration

Next.js 16.3.5 servi en HTTPS sur `127.0.0.1:18301` avec un certificat de recette éphémère. `IKBS_API_ORIGIN=http://127.0.0.1:18300` dirigeait `/api/v1` et les lectures SSR vers le Fastify réel. Fastify, Auth Emulator et Firestore Emulator étaient confinés en boucle locale au niveau système avec refus des sorties IP vérifié. Les deux profils Chrome 158 headless étaient distincts et jetables. Chrome passait par un proxy local qui fermait les connexions sortantes, avec contournement limité à la boucle locale prévue, résolution externe bloquée et QUIC désactivé. Une tentative vers une adresse réservée a atteint le proxy de refus et n’a pas quitté l’hôte. Le certificat était accepté uniquement dans les processus de test. Cette configuration ne qualifie aucune infrastructure de production.

Les ports, PID et cibles ont été vérifiés. La dernière exécution Chrome a identifié Auth 75837, Firestore 75838, Fastify 76076 et Next.js 76114. Aucun secret de production chargé dans le backend. Le seul nom de variable dans le fichier local Next.js était l’ancienne URL API publique. L’origine de recette a été passée explicitement. Aucun code standard, certificat ou environnement persistant ajouté.

## Scénarios

| Vérification | Statut | Évidence |
|---|---|---|
| Chaîne navigateur Next.js → Fastify → Firebase Auth Emulator → vérification Admin → identité IKBS et Firestore | PASS | Saisie d’un username dans un profil Chrome, d’un email dans l’autre. Rendu des espaces locaux sur les deux. Aucun simulacre de preuve Firebase pendant ce scénario. |
| Cookie et origine | PASS | Chrome confirme HttpOnly, Secure, SameSite=Lax, Path=/ et l’invisibilité dans document.cookie. Le mot de passe synthétique et le secret de la session échantillonnée ne figurent pas dans localStorage. Mutation et cookie traversent la réécriture HTTPS. |
| Deux profils Chrome et deux rendus SSR | PASS | Cookies distincts, profils et espaces locaux distincts. Deux appels SSR concurrents n’ont rendu que leur propre utilisateur. Le profil API a renvoyé `no-store`. |
| Parcours global, deux organisations et compte sans organisation | PASS | Route d’administration globale, sélecteur multi-organisations et état sans espace observés sur les fixtures liées à Firebase. Une navigation directe vers l’organisation de l’autre administrateur affiche l’espace indisponible. |
| Protection des retours | PASS | Le retour externe demandé via query string est rejeté. Le navigateur revient vers l’espace local autorisé. |
| Déconnexion | PASS | Déconnexion depuis l’espace privé, redirection login, cookie supprimé dans Chrome et rejeu du cookie refusé 401 par Fastify. |
| Chrome, permissions modifiées, CSRF et 403/404 | PASS | Dans Chrome, une édition sans en-tête CSRF renvoie 403. Le membre multi-organisation peut éditer A et ne voit pas cette action sur B. Le retrait réel de A produit 404 et rend son écran indisponible après relecture au premier plan. B reste accessible. |
| Chrome, inactivité et échéance absolue | PASS | Deux sessions réelles, dont une prolongée par la primitive du registre pour atteindre l’échéance absolue. Chrome reçoit 401 après l’inactivité puis après la durée absolue, respectivement. |
| Chrome, 429 et 503 | PASS | Onzième tentative sur un alias avec 429 et Retry-After. Après arrêt de l’émulateur Auth, une connexion fraîche reçoit 503 via la réécriture. |
| HTML privé du build | PASS | `next start` local a renvoyé 307 et `Cache-Control: private, no-store` pour la visite anonyme de `/dash`, `/dash/organisations`, `/espaces` et `/espace/A1234567`. Sur le serveur de développement, la protection du rendu était vérifiée par deux profils simultanés et l’API privée relayée conservait `no-store`. Aucun proxy de production testé. |
| Adresse IP cliente derrière la réécriture | FAIL | Le pair vu par Fastify est loopback. Voir le bilan sécurité. |

Le pilote Chrome sous le même profil système que les serveurs a échoué dans DevTools, avant recette complète. La qualification réussie a gardé l’isolement système sur les services et utilisé le mécanisme de proxy de refus décrit ci-dessus pour le navigateur. Les fixtures ont été recréées seulement après un nouveau préflight. Aucun contournement des gardes Firebase ni accès à un fournisseur réel.

## Régression et réserve

| Vérification | Statut | Résultat |
|---|---|---|
| `node --test tests/auth.test.mjs` | PASS, simulé | 8 tests de contrat. |
| `IKBS_TEST_CHROME=… node --test tests/auth-browser.test.mjs` | PASS, simulé | 1 scénario existant avec HTTPS et backend simulé. Ce scénario est distinct de celui connecté aux émulateurs réels. |
| `./node_modules/.bin/tsc --noEmit --incremental false` | PASS | Contrôle TypeScript. |
| `NEXT_TELEMETRY_DISABLED=1 npm run build -- --webpack` | PASS | Build Next.js et routes privées dynamiques. |
| `npm run lint` | FAIL, préexistant | 3 erreurs et 14 avertissements, aucun nouveau signal. |
| Recette avec le frontal de mise en service | NOT RUN | Certificat, proxy et configuration de production hors périmètre. |

Erreurs de lint inchangées.

- `src/app/(public)/data-table-demo/page.tsx:352` — `react/no-unescaped-entities`.
- `src/app/(public)/organisations/page.tsx:103` — `react-hooks/set-state-in-effect`.
- `src/features/organizations/components/OrganizationManagement.tsx:501` — `react-hooks/set-state-in-effect`.

Le frontend n’a pas été modifié pendant la recette. Le verdict global et les préconditions de mise en service sont consignés dans le rapport backend de synthèse.
