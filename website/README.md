# Statelite Documentation Website

The official landing page and learning surface for
[`@antihero/statelite`](https://www.npmjs.com/package/@antihero/statelite).

## Local development

Use Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
```

The website lives in the same repository as the Statelite package while keeping
its dependencies and build configuration isolated in this directory. It is a
standard Next.js application and can be deployed to Vercel with `website` set as
the project root directory.
