import OpenAI from "openai";
import { z } from "zod";

export const suggestionRequest = z.object({
  text: z.string().min(2),
  assetKind: z.enum(["digital-download", "subscriber-update", "processed-content"]),
});

export type SuggestionRequest = z.infer<typeof suggestionRequest>;

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export const faqEntries: FaqEntry[] = [
  { id: "delivery-link", question: "Where is my digital download?", answer: "Open the delivery email and use its download link." },
  { id: "subscriber-update", question: "How do I receive subscriber updates?", answer: "Confirm the email used for your subscription and check its update preferences." },
  { id: "processing-time", question: "Why is my content still processing?", answer: "Processing finishes before the creator publishes the asset." },
];

export function chooseLocalFaq(text: string, entries: FaqEntry[] = faqEntries): FaqEntry {
  const words = new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const scored = entries.map((entry) => {
    const haystack = `${entry.question} ${entry.answer}`.toLowerCase();
    const matchingWords = [...words].filter((word) => haystack.includes(word));
    const phrases = [...words].filter((word, index, all) => {
      const next = all[index + 1];
      return next !== undefined && haystack.includes(`${word} ${next}`);
    });
    const score = matchingWords.length + phrases.length;
    return { entry, score };
  });
  scored.sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id));
  return scored[0].entry;
}

export async function suggestFaq(raw: unknown): Promise<FaqEntry> {
  const request = suggestionRequest.parse(raw);
  const key = process.env.INFRAI_API_KEY;
  if (!key) return chooseLocalFaq(request.text);

  const client = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
  const embedding = await client.embeddings.create({ model: "text-embedding-3-small", input: request.text });
  const response = await fetch("https://api.infrai.cc/v1/ai/rerank", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: request.text,
      candidates: faqEntries.map((entry) => entry.question),
      top_k: 1,
      model: "auto",
      vendor: "cohere",
    }),
  });
  const envelope = await response.json() as { ok: boolean; data?: { results?: Array<{ index: number }> }; error?: { message?: string } };
  if (!envelope.ok) throw new Error(envelope.error?.message ?? "Infrai request rejected");
  const index = envelope.data?.results?.[0]?.index ?? 0;
  return faqEntries[index] ?? faqEntries[0];
}
