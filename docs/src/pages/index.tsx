// // import type { ReactNode } from "react";
// // import clsx from "clsx";
// // import Link from "@docusaurus/Link";
// // import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
// // import Layout from "@theme/Layout";
// // import HomepageFeatures from "@site/src/components/HomepageFeatures";
// // import Heading from "@theme/Heading";

// // import styles from "./index.module.css";
// // import "../../src/css/custom.css";

// // function HomepageHeader() {
// //   const { siteConfig } = useDocusaurusContext();
// //   return (
// //     <header className={clsx("hero hero--primary", styles.heroBanner)}>
// //       <div className="container">
// //         <Heading as="h1" className="hero__title">
// //           {siteConfig.title}
// //         </Heading>
// //         <p className="hero__subtitle">{siteConfig.tagline}</p>
// //         <div className={clsx(styles.buttons, styles["gap-1"])}>
// //           <Link
// //             className="button button--secondary button--lg"
// //             to="/docs/intro"
// //           >
// //             Get Started
// //           </Link>
// //           <Link
// //             className="button button--secondary button--lg"
// //             to="https://syraa.fun"
// //             target="_blank"
// //           >
// //             Website
// //           </Link>
// //         </div>
// //       </div>
// //     </header>
// //   );
// // }

// // export default function Home(): ReactNode {
// //   const { siteConfig } = useDocusaurusContext();
// //   return (
// //     <Layout
// //       title={`Hello from ${siteConfig.title}`}
// //       description="Description will go into a meta tag in <head />"
// //     >
// //       <HomepageHeader />
// //       <main>
// //         <HomepageFeatures />
// //       </main>
// //     </Layout>
// //   );
// // }

// import type { ReactNode } from "react";
// import clsx from "clsx";
// import Link from "@docusaurus/Link";
// import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
// import Layout from "@theme/Layout";
// import Heading from "@theme/Heading";

// import styles from "./index.module.css";
// import "../../src/css/custom.css";

// function HeroSection() {
//   const { siteConfig } = useDocusaurusContext();

//   return (
//     <header className={styles.heroDark}>
//       <div className={styles.heroGlow}></div>

//       <div className="container">
//         <div className={styles.badge}>⚡ AI Agents • Solana Ecosystem</div>

//         <Heading as="h1" className={styles.heroTitle}>
//           {siteConfig.title}
//         </Heading>

//         <p className={styles.heroSubtitle}>
//           Build faster. Automate smarter. Syra is the next-generation AI agent
//           engine designed for Web3 automation and high-performance workflows.
//         </p>

//         <div className={styles.buttonRow}>
//           <Link className="button button--primary button--lg" to="/docs/intro">
//             ⚡ Start Building
//           </Link>

//           <Link
//             className="button button--secondary button--lg"
//             to="https://syraa.fun"
//             target="_blank"
//           >
//             Visit Website ↗
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }

// function WhySection() {
//   return (
//     <section className={styles.sectionDark}>
//       <div className="container">
//         <Heading as="h2" className={styles.sectionTitle}>
//           Why Syra?
//         </Heading>

//         <div className={styles.featureGrid}>
//           <div className={styles.featureCard}>
//             <h3>🚀 Ultra-Speed Automation</h3>
//             <p>
//               Syra runs actions in parallel with optimized Solana RPC batching.
//             </p>
//           </div>

//           <div className={styles.featureCard}>
//             <h3>🧠 AI-Native Framework</h3>
//             <p>
//               Agents that learn, adapt, and improve—powered by LLM reasoning.
//             </p>
//           </div>

//           <div className={styles.featureCard}>
//             <h3>🔗 Built for Web3</h3>
//             <p>
//               Wallets, transactions, swaps, mempools — all deeply integrated.
//             </p>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function SuperpowerSection() {
//   return (
//     <section className={styles.sectionDarkAlt}>
//       <div className="container">
//         <Heading as="h2" className={styles.sectionTitle}>
//           Syra Superpowers
//         </Heading>

//         <div className={styles.superList}>
//           <div>⚡ Parallel Transactions</div>
//           <div>🤖 Autonomous Task Execution</div>
//           <div>📡 Real-time Market Monitoring</div>
//           <div>🔒 Built-in Wallet Security</div>
//           <div>⛓️ On-chain Event Triggers</div>
//           <div>🌐 Multi-Strategy Agents</div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function IntegrationSection() {
//   return (
//     <section className={styles.sectionDark}>
//       <div className="container">
//         <Heading as="h2" className={styles.sectionTitle}>
//           Integrations
//         </Heading>

//         <p className={styles.sectionSub}>
//           Use Syra with your favorite tools in the ecosystem.
//         </p>

//         <div className={styles.logoRow}>
//           <span>🟪 Solana</span>
//           <span>🟦 Jupiter</span>
//           <span>🌈 RainbowKit</span>
//           <span>🧠 Gemini AI</span>
//           <span>⚙️ Node.js</span>
//         </div>
//       </div>
//     </section>
//   );
// }

// function CTASection() {
//   return (
//     <section className={styles.sectionCTA}>
//       <div className="container">
//         <Heading as="h2" className={styles.ctaTitle}>
//           Ready to build your first AI Agent?
//         </Heading>

//         <p className={styles.ctaSubtitle}>
//           Explore the docs and deploy your Syra agent today.
//         </p>

//         <Link className="button button--primary button--lg" to="/docs/intro">
//           Get Started →
//         </Link>
//       </div>
//     </section>
//   );
// }

// export default function Home(): ReactNode {
//   return (
//     <Layout
//       title="Syra Docs"
//       description="Build, scale, and automate with Syra AI agents."
//     >
//       <HeroSection />
//       <main>
//         <WhySection />
//         <SuperpowerSection />
//         <IntegrationSection />
//         <CTASection />
//       </main>
//     </Layout>
//   );
// }

import { useEffect } from "react";
import { useHistory } from "@docusaurus/router";

export default function Home() {
  const history = useHistory();

  useEffect(() => {
    history.push("/docs/welcome");
  }, []);

  return null;
}
