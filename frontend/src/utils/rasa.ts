export type RasaBotMessage =
  | { recipient_id?: string; text?: string }
  | { image?: string; attachment?: any }
  | Record<string, any>;

function getBaseUrl() {
  // fallback ke localhost kalau env belum diset
  const base =
    process.env.NEXT_PUBLIC_RASA_URL?.replace(/\/+$/, "") ||
    "http://localhost:5005";
  return base;
}

export async function sendToRasa(
  message: string,
  senderId = "web-user"
): Promise<string> {
  const endpoint = `${getBaseUrl()}/webhooks/rest/webhook`;

  // timeout guard
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender: senderId, message }),
    signal: controller.signal,
  }).finally(() => clearTimeout(t));

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Rasa error (${res.status}): ${text}`);
  }

  // Rasa balikin array message
  let arr: RasaBotMessage[] = [];
  try {
    arr = JSON.parse(text);
  } catch {
    /* kalau bukan JSON array */
  }

  if (Array.isArray(arr) && arr.length) {
    const merged = arr
      .map((m: any) => m?.text)
      .filter(Boolean)
      .join("\n\n");
    return merged || "(tidak ada teks balasan)";
  }
  // fallback kalau plugin Rasa balikin string aneh
  return typeof text === "string" && text.trim() ? text : "(balasan kosong)";
}

export async function callRag(
  question: string,
  url = process.env.NEXT_PUBLIC_RAG_URL!
) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`RAG HTTP ${res.status}`);
  return res.json(); // expected: { answer, top_distance, top_similarity, is_match, k? }
}

export async function callRasa(message: string, url?: string) {
  const endpoint = (url || getBaseUrl()) + "/webhooks/rest/webhook";
  console.log("[RASA][fetch raw]", endpoint, {
    sender: "test-frontend",
    message,
  });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: "test-frontend", message }),
  });
  if (!res.ok) throw new Error(`Rasa HTTP ${res.status}`);
  return res.json(); // e.g., [{recipient_id, text}, ...]
}
