const WEBHOOK_URL = "http://localhost:5678/webhook-test/study-webhook";

export async function sendToWebhook(payload) {
  if (!payload || !payload.type) return;
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[Webhook] ${payload.type} sent successfully — ${response.status}`);
  } catch (error) {
    console.error(`[Webhook] Failed to send ${payload.type}:`, error);
  }
}
