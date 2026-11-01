# Le Mot Juste — déploiement Cloudflare

© 2026 SDF Technologie (Solution Digitale du Futur). Toute reproduction ou modification est interdite.

Projet statique déployé avec **Cloudflare Workers (static assets)**, la méthode actuelle de Cloudflare pour héberger un site sans serveur.

```
le-mot-juste-cloudflare/
├── wrangler.jsonc      configuration Cloudflare
├── package.json        scripts (dev, deploy)
└── public/             tout ce dossier est publié
    ├── index.html      l'application
    ├── 404.html        page d'erreur
    └── _headers        en-têtes de sécurité
```

## Déploiement (ligne de commande)

Prérequis : un compte Cloudflare gratuit et Node.js (version LTS récente).

```bash
cd le-mot-juste-cloudflare
npm install
npx wrangler login      # ouvre le navigateur pour autoriser votre compte
npx wrangler deploy     # publie le site
```

L'adresse du site s'affiche à la fin : `https://le-mot-juste.<votre-sous-domaine>.workers.dev`

## Tester en local avant de publier

```bash
npx wrangler dev
```

## Mettre à jour l'application

Remplacez `public/index.html`, puis relancez `npx wrangler deploy`.

## Déploiement automatique depuis GitHub

1. Envoyez le dossier dans un dépôt GitHub.
2. Tableau de bord Cloudflare → **Workers & Pages** → **Create** → importez le dépôt (Workers Builds).
3. Commande de déploiement : `npx wrangler deploy`. Chaque `git push` met le site à jour.

## Domaine personnalisé

Le domaine doit être géré par Cloudflare (DNS). Deux options :

- Tableau de bord : **Workers & Pages** → `le-mot-juste` → **Settings** → **Domains & Routes** → **Add** → **Custom domain**.
- Ou décommentez la section `routes` dans `wrangler.jsonc` et relancez `npx wrangler deploy`.
