/**

 * ShadowFeed discovery manifest — Step 9 provider onboarding.

 * Served at GET /.well-known/shadowfeed-feeds.json (API + synced to syraa.fun).

 *

 * @see https://docs.shadowfeed.app/providers/onboarding#step-9--publish-your-discovery-manifest

 */

import { X402_DISCOVERY_RESOURCE_PATHS } from './x402DiscoveryResourcePaths.js';
import { SYRA_META_DESCRIPTION } from './syraBranding.js';

import { buildShadowfeedFeedFromCatalog } from './x402ResourceCatalog.js';



function envOr(key, fallback) {

  const v = process.env[key]?.trim();

  return v || fallback;

}



function providerConfig() {

  const handle = envOr('SHADOWFEED_PROVIDER_HANDLE', 'syra');

  const website = envOr('SHADOWFEED_WEBSITE_URL', 'https://syraa.fun').replace(/\/$/, '');

  const api = envOr('SHADOWFEED_API_URL', 'https://api.syraa.fun').replace(/\/$/, '');



  return {

    handle,

    website,

    api,

    name: envOr('SHADOWFEED_PROVIDER_DISPLAY_NAME', 'Syra'),

    description: envOr(

      'SHADOWFEED_PROVIDER_DESCRIPTION',

      SYRA_META_DESCRIPTION,

    ),

    twitter_handle: envOr('SHADOWFEED_TWITTER_HANDLE', '@syraa_ai'),

    contact_email: envOr('SHADOWFEED_CONTACT_EMAIL', 'hello@syraa.fun'),

  };

}



function buildFeeds() {

  return X402_DISCOVERY_RESOURCE_PATHS.map((segment) => buildShadowfeedFeedFromCatalog(segment));

}



/**

 * Build the ShadowFeed discovery manifest object.

 * @returns {Record<string, unknown>}

 */

export function buildShadowfeedFeedsManifest() {

  const provider = providerConfig();

  const { handle, website, api } = provider;



  return {

    version: '1',

    provider: {

      name: provider.name,

      handle,

      description: provider.description,

      website,

      api,

      twitter_handle: provider.twitter_handle,

      contact_email: provider.contact_email,

    },

    partnerships: [

      {

        marketplace: 'shadowfeed',

        marketplace_url: 'https://shadowfeed.app',

        marketplace_handle: handle,

        marketplace_verification_url: `https://api.shadowfeed.app/providers/${handle}/manifest`,

        integration_mode: 'partner_bridge',

        partner_endpoint: api,

      },

      {

        marketplace: 'x402',

        marketplace_url: 'https://x402.org',

        marketplace_handle: handle,

        integration_mode: 'direct',

        partner_endpoint: api,

        notes: 'Direct USDC micropayments on Solana and Base via HTTP 402.',

      },

    ],

    feeds: buildFeeds(),

    supported_payments: [

      {

        scheme: 'partner_bridge',

        marketplace: 'shadowfeed',

        asset: 'STX',

        settlement_network: 'stacks:mainnet',

      },

      {

        scheme: 'exact',

        marketplace: 'syra',

        asset: 'USDC',

        settlement_network: 'solana:mainnet',

      },

      {

        scheme: 'exact',

        marketplace: 'syra',

        asset: 'USDC',

        settlement_network: 'eip155:8453',

      },

    ],

  };

}


