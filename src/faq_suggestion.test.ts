import assert from "node:assert/strict";
import test from "node:test";
import { chooseLocalFaq, suggestionRequest } from "./faq_suggestion.ts";

test("delivery language selects the delivery FAQ", () => {
  const request = suggestionRequest.parse({ text: "my download link is missing", assetKind: "digital-download" });
  assert.equal(chooseLocalFaq(request.text).id, "delivery-link");
});

test("subscriber language selects the update FAQ", () => {
  const request = suggestionRequest.parse({ text: "where are my subscriber updates", assetKind: "subscriber-update" });
  assert.equal(chooseLocalFaq(request.text).id, "subscriber-update");
});
