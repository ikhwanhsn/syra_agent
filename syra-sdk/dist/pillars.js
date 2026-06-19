function ok(res) {
    if (!res.success)
        throw new Error(res.error ?? "Request failed");
    return res.data;
}
export function createEarnModule(client) {
    return {
        summary(walletOrAnonymousId) {
            return client.get("/earn/summary", { wallet: walletOrAnonymousId }).then(ok);
        },
        payout(body) {
            return client.post("/earn/payout", body);
        },
    };
}
export function createTreasuryModule(client) {
    return {
        billingSummary() {
            return client.get("/agent/billing/summary");
        },
        walletBalance() {
            return client.get("/agent/wallet/balance");
        },
        dashboardSummary() {
            return client.get("/dashboard-summary");
        },
    };
}
export function createInvestModule(client) {
    return {
        opportunities(params) {
            return client.get("/invest/opportunities", params);
        },
        positions(params) {
            return client.get("/invest/positions", params);
        },
        deploy(body) {
            return client.post("/invest/deploy", body);
        },
    };
}
export function createSpendModule(client) {
    return {
        /** Generic x402 route call (402 retry when signer configured on client). */
        call(path, init) {
            const method = init?.method ?? "GET";
            if (method === "POST")
                return client.post(path, init?.body);
            return client.get(path, init?.params);
        },
        listTools() {
            return client.get("/agent/tools");
        },
        callTool(toolId, params) {
            return client.post("/agent/tools/call", { toolId, params });
        },
        pay402(body) {
            return client.post("/agent/wallet/pay-402", body);
        },
    };
}
export function createGrowModule(client) {
    return {
        portfolio(params) {
            return client.get("/grow/portfolio", params);
        },
        recommendations(params) {
            return client.get("/grow/recommendations", params);
        },
        apply(body) {
            return client.post("/grow/apply", body);
        },
    };
}
export function createPillarsModule(client) {
    return {
        discover() {
            return client.get("/pillars");
        },
        get(pillarId) {
            return client.get(`/pillars/${pillarId}`);
        },
    };
}
export function attachPillarModules(client) {
    return {
        earn: createEarnModule(client),
        treasury: createTreasuryModule(client),
        invest: createInvestModule(client),
        spend: createSpendModule(client),
        grow: createGrowModule(client),
        pillars: createPillarsModule(client),
    };
}
