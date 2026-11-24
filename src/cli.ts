import { suggestFaq } from "./faq_suggestion.ts";

const result = await suggestFaq({
  text: process.argv.slice(2).join(" ") || "my digital download has not arrived",
  assetKind: "digital-download",
});
console.log(JSON.stringify(result, null, 2));
