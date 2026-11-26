This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## URL de déploiement

- Next.js utilise `NEXT_PUBLIC_APP_URL` pour l’origine publique du site et `IKBS_API_ORIGIN` pour joindre Fastify. Définir ces variables avant le build. L’origine Fastify peut être une adresse réseau interne accessible par le serveur Next.js.
- Fastify utilise `APP_PUBLIC_URL` pour générer les liens dans les e-mails. En déploiement, renseigner l’origine HTTPS publique de Next.js dans l’environnement du service API, notamment dans `.env.production` pour le Compose de production. Si `CORS_ORIGINS` est fourni, y inclure cette même origine.
- Pour les tests locaux sur Mac, le site peut utiliser `http://localhost:3000` et le serveur Next.js joindre Fastify sur `http://127.0.0.1:3000`.
