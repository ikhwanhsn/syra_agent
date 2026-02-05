import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Syra Agent",
  tagline: "The first x402-native AI agent trading assistant on Solana",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://docs.syraa.fun",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "syra-ai",
  projectName: "syra-monorepo",

  onBrokenLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  // plugins: ["./src/plugins/tailwind.config.js"],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/syra-ai/syra-monorepo/tree/main/docs/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/syra-ai/syra-monorepo/tree/main/docs/",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          {
            to: "/docs/welcome", // new destination
            from: ["/", "/index"], // redirect from homepage
          },
        ],
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/logo.jpg",
    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: "Syra Docs",
      logo: {
        alt: "My Site Logo",
        src: "img/logo.jpg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        // { to: "/blog", label: "Blog", position: "left" },
        // {
        //   to: "/documentation",
        //   label: "Documentation",
        //   position: "left",
        // },
        {
          href: "https://syraa.fun",
          label: "Website",
          position: "right",
        },
        {
          href: "https://t.me/syra_ai",
          label: "Telegram",
          position: "right",
        },
        {
          href: "https://t.me/syra_trading_bot",
          label: "Bot",
          position: "right",
        },
        {
          href: "https://x.com/syra_agent",
          label: "X",
          position: "right",
        },
        {
          href: "https://pump.fun/coin/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump",
          label: "Pump.fun",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Documentation",
              to: "/docs/welcome",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Telegram",
              href: "https://t.me/syra_ai",
            },
            {
              label: "X Community",
              href: "https://x.com/i/communities/1984803953360716275",
            },
            {
              label: "X Official",
              href: "https://x.com/syra_agent",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Soon",
              to: "/",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Syra AI Labs.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
