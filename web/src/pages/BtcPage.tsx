import { useState } from "react";

import { cn } from "@/lib/utils";

import {

  DASHBOARD_CONTENT_SHELL,

  PAGE_PADDING_TOP_STANDARD,

  PAGE_SAFE_AREA_BOTTOM,

} from "@/lib/layoutConstants";

import { BtcBubblemapChart } from "@/components/btc/BtcBubblemapChart";

import { BtcStatCards, BtcDataSourcesStrip } from "@/components/btc/BtcStatCards";

import { BtcExchangeCompare } from "@/components/btc/BtcExchangeCompare";

import { BtcPageBackdrop } from "@/components/btc/BtcPageBackdrop";

import { BtcPageHero } from "@/components/btc/BtcPageHero";

import { BtcSectionNav } from "@/components/btc/BtcSectionNav";

import { BtcDashboardSectionsBlock } from "@/components/btc/sections/btcDashboardSections";

import { useBtcBubblemap, useBtcDashboard } from "@/hooks/useBtcData";

import type { BtcExchange, BtcInterval } from "@/lib/btcApi";

import { btcPageShell } from "@/components/btc/btcStyles";



export default function BtcPage() {

  const [exchange, setExchange] = useState<BtcExchange>("binance");

  const [interval, setInterval] = useState<BtcInterval>("1h");



  const dashboardQ = useBtcDashboard();

  const bubblemapQ = useBtcBubblemap({ exchange, interval, limit: 200 });



  const overview = dashboardQ.data?.overview;

  const sections = dashboardQ.data?.sections;

  const dashboardLoading = dashboardQ.isLoading && !dashboardQ.data;



  return (

    <div className={btcPageShell}>

      <BtcPageBackdrop />

      <BtcSectionNav />

      <div

        className={cn(

          DASHBOARD_CONTENT_SHELL,

          "relative space-y-8 xl:pr-48",

          PAGE_PADDING_TOP_STANDARD,

          PAGE_SAFE_AREA_BOTTOM,

        )}

      >

        <BtcPageHero overview={overview} loading={dashboardLoading} />



        <BtcStatCards overview={overview} loading={dashboardLoading} />



        <BtcExchangeCompare overview={overview} loading={dashboardLoading} />



        {bubblemapQ.isError ? (
          <div className="scroll-mt-24 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
            <p className="font-display text-sm font-semibold text-destructive">Chart unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {bubblemapQ.error instanceof Error ? bubblemapQ.error.message : "Failed to load bubblemap"}
            </p>
          </div>
        ) : (
          <BtcBubblemapChart
            data={bubblemapQ.data}
            exchange={exchange}
            interval={interval}
            loading={bubblemapQ.isLoading && !bubblemapQ.data}
            onExchangeChange={setExchange}
            onIntervalChange={setInterval}
          />
        )}



        <BtcDashboardSectionsBlock

          sections={sections}

          loading={dashboardLoading}

          computedAt={dashboardQ.data?.computedAt}

        />



        <section id="section-sources" className="scroll-mt-24">

          <BtcDataSourcesStrip />

        </section>



        {dashboardQ.isError ? (

          <p className="text-center text-xs text-muted-foreground">

            Some metrics may be unavailable. Data refreshes automatically on a rate-limit-aware schedule.

          </p>

        ) : null}

      </div>

    </div>

  );

}


