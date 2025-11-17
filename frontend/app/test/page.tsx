"use client";

import PaidAPICall from "@/components/test/PaidApiCall";
import { Button } from "@/components/ui/button";
import { createFareMeterClient } from "@/lib/farameter-client";

const TestPage = () => {
  const tryATXP = async () => {
    const res = await fetch(`/api/atxp/x`);
    const data = await res.json();
    console.log("data", data);
  };
  const tryCorbits = async () => {
    const res = await fetch(`/api/corbits/nansen`, { method: "POST" });
    const data = await res.json();
    console.log("data", data);
  };
  const tryFarameterClient = async () => {
    const fetchWithPayment = await createFareMeterClient();
    const res = await fetchWithPayment("/api/corbits/mint", { method: "POST" });
    const data = await res.json();
    console.log("data", data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1>Test</h1>
      <Button variant="default" onClick={tryATXP}>
        Try ATXPs
      </Button>
      <Button variant="default" onClick={tryCorbits}>
        Try Corbits
      </Button>
      <Button variant="default" onClick={tryFarameterClient}>
        Try FareMeter Client
      </Button>
      <PaidAPICall />
    </div>
  );
};

export default TestPage;
