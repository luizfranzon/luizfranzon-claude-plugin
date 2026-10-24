import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeBrowser, withPage } from "./browser";

after(closeBrowser);

test("abre página, lê conteúdo e fecha a aba mesmo com erro", async () => {
  const title = await withPage(async (page) => {
    await page.setContent("<title>ok</title>");
    return page.title();
  });
  assert.equal(title, "ok");

  let leaked: import("playwright-core").Page | undefined;
  await assert.rejects(withPage(async (page) => { leaked = page; throw new Error("x"); }));
  assert.equal(leaked!.isClosed(), true);
});
