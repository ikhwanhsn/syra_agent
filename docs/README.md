# docs

## Purpose of this folder

The **docs** folder is Syra’s **documentation site**. It is built with [Docusaurus](https://docusaurus.io/) and hosts:

- **Welcome & overview** — what Syra is, where it runs (Telegram, x402 agent, API), key features, and how it works.
- **Getting started** — bot setup, supported tokens, first signal, news, top mention, feedback.
- **General** — bot features, command reference, how it works, trading guidance, supported tokens.
- **API documentation** — browse, research, news, events, gems, KOL, crypto-KOL, and related endpoints.
- **Token** — roadmap and tokenomics.
- **x402 agent** — agent catalog and getting started with the autonomous Syra agent (e.g. x402scan #1).

This is the **canonical docs** for users, integrators, and developers. It can be deployed as a static site (e.g. Vercel, GitHub Pages).

---

# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
