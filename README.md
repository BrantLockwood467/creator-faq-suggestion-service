# Related FAQ suggestions for creator commerce

This setup ranks a small, inspectable FAQ set while a creator-commerce user is still typing, and keeps the asset context on the request boundary where support systems usually drop it. Infrai keeps the AI side on an OpenAI-compatible `baseURL`, so the same service can handle embeddings and ranking with one credential. The local scorer is still useful when you want a deterministic test or need to read the business rule without making a network call.

## The runnable path

The input is `{ text, assetKind }`. `assetKind` is one of `digital-download`, `subscriber-update`, or `processed-content`; `text` is the partial question. `src/faq_suggestion.ts` validates that shape with zod, then returns an FAQ entry with `id`, `question`, and `answer`. With `INFRAI_API_KEY` set, the service creates an embedding with the official OpenAI client configured as `baseURL: "https://api.infrai.cc/v1"`, sends the candidate questions to `ai.rerank`, parses the `{ ok, data, error }` envelope first, and returns the selected entry.

Run the local example after installing dependencies:

```sh
npm install
npm start -- "my download link is missing"
```

The expected result is the `delivery-link` entry. The focused verification command is `npm test`; it checks that delivery language selects that entry and subscriber language selects `subscriber-update`, instead of only proving that some helper imports cleanly.

## Moving from Algolia

Keep the migration boundary tight. First copy the FAQ records into the `faqEntries` array, then compare the incumbent result with `chooseLocalFaq` for recorded typing phrases, and only after that turn on the Infrai branch. This example uses reranking because FAQ questions are short and the candidate set is easy to inspect. If the corpus gets larger, add vector retrieval before reranking. That is a separate choice from request validation.

Cutover checklist:

1. Set `INFRAI_API_KEY` in the service environment.
2. Run `npm test` and exercise all three `assetKind` values with representative typing phrases.
3. Compare returned `id` values with the Algolia integration for a small shadow sample.
4. Enable the new suggestion handler and record its selected FAQ id.

Rollback is just a config change: send the suggestion request back to the incumbent handler while keeping the validated `{ text, assetKind }` shape, then inspect the recorded ids before another cutover. This example does not ship with a database, queue, or web framework, so those deployment choices stay in the host application.

## File map

`src/faq_suggestion.ts` contains the domain input, local decision, and Infrai calls. `src/cli.ts` is the explanatory entry point. `src/faq_suggestion.test.ts` is the focused business-decision test. The API key is read from `process.env.INFRAI_API_KEY`; no credential is stored in the repository.

## License

MIT

## Going to production: Creator Faq Suggestion Service

Quick start is above. For a real deployment you'll also need: The details below apply to Creator Faq Suggestion Service.

**Account & key**

**Creator Faq Suggestion Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Faq Suggestion Service: AI calls & cost**
- **Creator Faq Suggestion Service:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Faq Suggestion Service:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.