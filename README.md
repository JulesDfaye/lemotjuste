# Le Mot Juste — déploiement Cloudflare (avec administration)

© 2026 SDF Technologie (Solution Digitale du Futur). Toute reproduction ou modification est interdite.

Cloudflare Workers (static assets) + base **D1** pour les statistiques. Page d'administration : `/admin`.

## Première installation (une seule fois)

```bash
npm install
npx wrangler login
npx wrangler d1 create le-mot-juste-db        # copiez le database_id dans wrangler.jsonc
npx wrangler d1 execute le-mot-juste-db --remote --file=schema.sql
npx wrangler deploy
npx wrangler secret put ADMIN_PASSWORD        # saisissez le mot de passe administrateur quand Wrangler le demande
npx wrangler secret put SESSION_SECRET        # une longue chaîne aléatoire (40 caractères ou plus)
```

Ouvrez ensuite `https://<votre-site>/admin` et connectez-vous avec l'e-mail défini dans `wrangler.jsonc` (`ADMIN_EMAIL`) et le mot de passe saisi ci-dessus. Le mot de passe n'est écrit dans aucun fichier du projet. Sans les deux secrets, la connexion répond « non configuré ».
Avec un déploiement GitHub (Workers Builds), ajoutez les deux secrets dans Settings → Variables and Secrets.

## Mises à jour

Modifiez les fichiers puis `npx wrangler deploy`.

## Ce qui est mesuré (anonyme)

Visites et visiteurs uniques, jeux lancés et terminés, taux de réussite et score moyen par jeu, questions les plus ratées, appareils, pays, provenance, dernières parties.
Aucune adresse IP n'est enregistrée ; un identifiant aléatoire est gardé dans le navigateur. Les données sont stockées dans votre D1.

## Sécurité

Mot de passe vérifié côté serveur, session de 8 h (cookie HttpOnly signé). Pour limiter les essais de mot de passe, ajoutez dans Cloudflare une règle de rate limiting sur `/api/admin/login`.
