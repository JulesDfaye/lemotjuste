# Le Mot Juste — déploiement Vercel (avec administration)

© 2026 SDF Technologie (Solution Digitale du Futur). Toute reproduction ou modification est interdite.

```
public/   le site (index.html), la page /admin, la page 404
api/      fonctions serveur : /api/track et /api/admin/{login,logout,stats}
lib/      code partagé
vercel.json   en-têtes de sécurité
```

## 1. Publier le projet

- **Avec GitHub** : envoyez le dossier dans un dépôt, puis sur vercel.com → **Add New… → Project** → importez le dépôt.
  Réglages : **Framework Preset = Other**, laissez *Build Command* et *Output Directory* vides.
- **Avec la ligne de commande** : `npx vercel` puis `npx vercel --prod`.

## 2. Créer la base de statistiques (Neon)

Dans le projet Vercel : **Storage** (ou Marketplace) → **Neon (Postgres)** → *Create* → connectez-la au projet.
Vercel ajoute automatiquement la variable `DATABASE_URL`. La table se crée toute seule à la première visite.

## 3. Variables d'environnement (Settings → Environment Variables)

| Nom | Valeur |
|---|---|
| `ADMIN_EMAIL` | sdftechnologie@gmail.com |
| `ADMIN_PASSWORD` | votre mot de passe (saisi uniquement ici, jamais dans un fichier) |
| `SESSION_SECRET` | une longue chaîne aléatoire (40 caractères ou plus) |

Cochez *Sensitive* pour le mot de passe et le secret. **Redéployez** ensuite (Deployments → … → Redeploy) : les variables ne s'appliquent qu'aux nouveaux déploiements.

## 4. Utiliser

Ouvrez `https://<votre-site>/admin` et connectez-vous. Sans les trois variables, la connexion répond « non configuré ».

## Ce qui est mesuré (anonyme)

Visites et visiteurs uniques, parties lancées et terminées, réussite et score moyen par jeu, questions les plus ratées, appareils, pays, provenance, dernières parties. Aucune adresse IP n'est enregistrée.

## Conseils

- Région des fonctions : choisissez une région proche de votre base Neon et de vos visiteurs (Settings → Functions).
- Limitez les essais de mot de passe avec une règle de limitation de débit sur `/api/admin/login` (Firewall), si votre offre Vercel le permet.
