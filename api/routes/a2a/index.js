/**
 * AIP-02 A2A JSON-RPC 2.0 server — task/create + task/status.
 * Reuses Syra x402 payment gating and agent tool executor.
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import {
  requirePaymentSapEscrowOrExact,
  settleSapEscrowOrFacilitator,
} from "../utils/sapEscrowPayment.js";
import {
  AIP_A2A_CAPABILITY_IDS,
  getAipCapabilityPriceUsd,
} from "../libs/aipAgentCard.js";
import { executeAipCapability } from "../libs/aipTaskExecutor.js";
import { getPaymentSignatureHeaderFromReq } from "../utils/x402PaymentV2.js";

const { requirePayment } = await getV2Payment();

/** @type {Map<string, { id: string; status: string; artifact?: unknown; error?: string; capability?: string }>} */
const tasks = new Map();

/**
 * @param {unknown} id
 * @param {unknown} result
 */
function jsonRpcOk(id, result) {
  return { jsonrpc: "2.0", result, id: id ?? null };
}

/**
 * @param {unknown} id
 * @param {number} code
 * @param {string} message
 * @param {unknown} [data]
 */
function jsonRpcError(id, code, message, data) {
  return { jsonrpc: "2.0", error: { code, message, ...(data != null ? { data } : {}) }, id: id ?? null };
}

/**
 * Middleware: require x402 payment for task/create only; task/status is free.
 * @param {ReturnType<typeof requirePayment>} requirePaymentFn
 */
function requireA2aTaskPayment(requirePaymentFn) {
  return async (req, res, next) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const method = String(body.method || "").trim();

    if (method === "task/status") {
      return next();
    }

    if (method !== "task/create") {
      return next();
    }

    const capId = String(body.params?.capability || "").trim();
    if (!capId) {
      return res.json(jsonRpcError(body.id, -32602, "Missing capability in params"));
    }
    if (!AIP_A2A_CAPABILITY_IDS.includes(capId)) {
      return res.json(jsonRpcError(body.id, -32602, `Unsupported capability: ${capId}`));
    }

    const priceUsd = getAipCapabilityPriceUsd(capId);
    const paymentOptions = {
      price: priceUsd,
      resource: `/a2a/${capId}`,
      description: `AIP A2A task: ${capId}`,
      method: "POST",
    };

    return requirePaymentSapEscrowOrExact(requirePaymentFn, paymentOptions)(req, res, next);
  };
}

async function handleTaskCreate(req, res, params, id) {
  const capId = String(params?.capability || "").trim();
  const input = String(params?.input ?? "").trim();
  const taskId =
    String(params?.taskId || "").trim() ||
    `atask_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (!capId || !input) {
    return res.json(jsonRpcError(id, -32602, "Missing capability or input"));
  }
  if (!AIP_A2A_CAPABILITY_IDS.includes(capId)) {
    return res.json(jsonRpcError(id, -32602, `Unsupported capability: ${capId}`));
  }

  const hasPayment =
    Boolean(getPaymentSignatureHeaderFromReq(req)) ||
    String(req.headers["x-payment-protocol"] || "").trim() === "SAP-x402" ||
    Boolean(req.x402Payment);

  if (!hasPayment) {
    return res.json(
      jsonRpcError(id, -40201, "Payment required — retry with PAYMENT-SIGNATURE or SAP-x402", {
        capability: capId,
        priceUsd: getAipCapabilityPriceUsd(capId),
        accepts: "x402-v2",
      })
    );
  }

  tasks.set(taskId, { id: taskId, status: "WORKING", capability: capId });

  const servicePayload = JSON.stringify({
    resource: `/a2a/${capId}`,
    taskId,
    capability: capId,
    at: new Date().toISOString(),
  });

  try {
    const result = await executeAipCapability(capId, input, { host: req.get("host") });
    tasks.set(taskId, {
      id: taskId,
      status: "COMPLETED",
      capability: capId,
      artifact: result.artifact,
    });
    if (req.x402Payment) {
      await settleSapEscrowOrFacilitator(res, req, servicePayload);
    }
    return res.json(
      jsonRpcOk(id, {
        taskId,
        status: "COMPLETED",
        artifact: result.artifact,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    tasks.set(taskId, { id: taskId, status: "FAILED", capability: capId, error: message });
    return res.json(jsonRpcError(id, -32002, message, { taskId, status: "FAILED" }));
  }
}

function handleTaskStatus(params, id) {
  const taskId = String(params?.taskId || "").trim();
  if (!taskId) {
    return jsonRpcError(id, -32602, "Missing taskId");
  }
  const task = tasks.get(taskId);
  if (!task) {
    return jsonRpcError(id, -32001, `Task not found: ${taskId}`);
  }
  return jsonRpcOk(id, {
    taskId: task.id,
    status: task.status,
    ...(task.artifact != null ? { artifact: task.artifact } : {}),
    ...(task.error ? { error: task.error } : {}),
  });
}

export async function createA2aRouter() {
  const router = express.Router();
  router.use(express.json({ limit: "256kb" }));

  const payMiddleware = requireA2aTaskPayment(requirePayment);

  router.post("/", payMiddleware, async (req, res) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { jsonrpc, method, params, id } = body;

    if (jsonrpc !== "2.0" || !method || id === undefined) {
      return res.json(jsonRpcError(id ?? null, -32600, "Invalid JSON-RPC request"));
    }

    if (method === "task/create") {
      return handleTaskCreate(req, res, params, id);
    }
    if (method === "task/status") {
      return res.json(handleTaskStatus(params, id));
    }

    return res.json(jsonRpcError(id, -32601, `Unknown method: ${method}`));
  });

  return router;
}

export default createA2aRouter;
