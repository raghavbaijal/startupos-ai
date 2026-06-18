import { Receiver } from "@upstash/qstash";
import { runOrchestrationPipeline } from "@/lib/agents/orchestrator";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("upstash-signature");

    const qstashCurrentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const qstashNextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    // Verify QStash signature if keys are provided in env
    if (
      qstashCurrentSigningKey &&
      qstashNextSigningKey &&
      qstashCurrentSigningKey !== "placeholder" &&
      qstashNextSigningKey !== "placeholder" &&
      qstashCurrentSigningKey !== "placeholder_key" &&
      qstashNextSigningKey !== "placeholder_key"
    ) {
      const receiver = new Receiver({
        currentSigningKey: qstashCurrentSigningKey,
        nextSigningKey: qstashNextSigningKey,
      });

      const isValid = await receiver
        .verify({
          signature: signature || "",
          body: rawBody,
        })
        .catch(() => false);

      if (!isValid) {
        console.error("[QStash Webhook] Invalid QStash Signature header verified.");
        return new NextResponse("Unauthorized Signature", { status: 401 });
      }
    } else {
      console.warn(
        "[QStash Webhook] QStash signing keys not configured. Skipping signature verification (non-production mode)."
      );
    }

    // Process payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("[QStash Webhook] Failed to parse request body as JSON:", parseErr);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { workspaceId, userId } = payload;
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "Missing workspaceId or userId in payload" }, { status: 400 });
    }

    console.log(`[QStash Webhook] Received webhook trigger for workspace ${workspaceId}`);

    // Trigger the orchestrator pipeline
    // Progress and failures are updated in the jobs table inside the orchestrator
    const result = await runOrchestrationPipeline(workspaceId, userId);

    if (!result.success) {
      console.error(`[QStash Webhook] Pipeline execution failed: ${result.error}`);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Pipeline executed successfully" });
  } catch (err: any) {
    console.error("[QStash Webhook] Unhandled exception in webhook handler:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
