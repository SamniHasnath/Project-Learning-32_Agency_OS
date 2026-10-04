import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const year = new Date().getUTCFullYear();
const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerAgency(page: Page, agencyName: string) {
  const email = `owner-${unique()}@e2e.test`;
  await page.goto("/register");
  await page.getByLabel("Agency name").fill(agencyName);
  await page.getByLabel("Your name").fill("Erin Example");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel(/^Password/).fill("Password123!");
  await page.getByLabel("Confirm password").fill("Password123!");
  await page.getByRole("button", { name: "Create agency account" }).click();
  await expect(page).toHaveURL(/\/settings/);
  return email;
}

test.describe.configure({ mode: "serial" });

let quotationUrl = "";

test("quotation → invoice → payments, end to end", async ({ page }) => {
  await registerAgency(page, "E2E Studio");

  // ── Client ────────────────────────────────────────────────────────────────
  await page.goto("/clients/new");
  await page.getByLabel("Contact name").fill("Dana Buyer");
  await page.getByLabel("Email").fill(`dana-${unique()}@client.test`);
  await page.getByLabel("Company").fill("Buyer Corp");
  await page.getByLabel("Billing address").fill("1 Market St, Springfield");
  await page.getByRole("button", { name: "Add client" }).click();
  await expect(page.getByRole("heading", { name: /Buyer Corp/ })).toBeVisible();

  // ── Quotation: create with auto-filled client, two lines, tax ────────────
  await page.getByRole("link", { name: "+ Quotation" }).click();
  await expect(page.getByTestId("client-autofill")).toContainText("1 Market St, Springfield");
  await page.getByLabel("Title").fill("Brand refresh");
  await page.getByLabel("Description 1").fill("Strategy workshop");
  await page.getByLabel("Qty").first().fill("2");
  await page.getByLabel(/Unit price/).first().fill("1500");
  await page.getByRole("button", { name: "+ Add line item" }).click();
  await page.getByLabel("Description 2").fill("Design days");
  await page.getByLabel("Qty").nth(1).fill("10");
  await page.getByLabel(/Unit price/).nth(1).fill("95.5");
  await page.getByLabel("Tax rate (%)").fill("10");
  await page.getByLabel(/^Notes/).fill("Two revision rounds included.");
  await expect(page.getByTestId("preview-total")).toHaveText("$4,350.50");
  await page.getByRole("button", { name: "Save as draft" }).click();

  await expect(page.getByRole("heading", { name: new RegExp(`QT-${year}-0001`) })).toBeVisible();
  quotationUrl = page.url();
  const sheet = page.locator(".document-sheet");
  await expect(sheet).toContainText("Buyer Corp");
  await expect(sheet).toContainText("$3,955.00"); // subtotal
  await expect(sheet).toContainText("$395.50"); // tax
  await expect(sheet).toContainText("$4,350.50"); // total

  // Conversion is not offered before acceptance.
  await expect(page.getByTestId("convert-button")).toHaveCount(0);

  // ── Status workflow ───────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Mark as sent" }).click();
  await expect(page.getByRole("heading", { name: /Sent/ })).toBeVisible();
  await page.getByRole("button", { name: "Mark as accepted" }).click();
  await expect(page.getByRole("heading", { name: /Accepted/ })).toBeVisible();

  // ── Preview + PDF ─────────────────────────────────────────────────────────
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(`QT-${year}-0001.pdf`);
  const bytes = await readFile((await file.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");

  await page.getByRole("link", { name: "Preview" }).click();
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
  await expect(page.locator(".document-sheet")).toContainText("QUOTATION");
  await page.goBack();

  // ── Convert (double-click must not create two invoices) ───────────────────
  await page.getByTestId("convert-button").dblclick();
  await expect(page).toHaveURL(/\/invoices\/[0-9a-f-]+\?converted=1/);
  await expect(page.getByRole("heading", { name: new RegExp(`INV-${year}-0001`) })).toBeVisible();
  await expect(page.getByText("Invoice created from the accepted quotation")).toBeVisible();
  const invoiceSheet = page.locator(".document-sheet");
  await expect(invoiceSheet).toContainText("Strategy workshop");
  await expect(invoiceSheet).toContainText(`QT-${year}-0001`); // reference copied
  await expect(page.getByTestId("outstanding-amount")).toHaveText("$4,350.50");

  await page.goto("/invoices");
  await expect(page.getByRole("link", { name: new RegExp(`INV-${year}-0001`) })).toHaveCount(1);
  await expect(page.getByRole("link", { name: new RegExp(`INV-${year}-0002`) })).toHaveCount(0);
  await page.getByRole("link", { name: new RegExp(`INV-${year}-0001`) }).click();

  // ── Payments ──────────────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Mark as sent" }).click();
  await page.getByTestId("payment-amount").fill("4000");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByTestId("outstanding-amount")).toHaveText("$350.50");
  await expect(page.getByRole("heading", { name: /Partially Paid/ })).toBeVisible();

  await page.getByTestId("payment-amount").fill("500");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Payment can't exceed the outstanding $350.50.")).toBeVisible();

  await page.getByRole("button", { name: "Full" }).click();
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByRole("heading").getByText("Paid", { exact: true })).toBeVisible();
  await expect(page.getByTestId("outstanding-amount")).toHaveText("$0.00");
  await expect(page.getByTestId("payment-history").locator("li")).toHaveCount(2);
  await expect(page.getByTestId("payment-amount")).toHaveCount(0); // no more payments possible
});

test("another agency cannot open the first agency's quotation", async ({ page }) => {
  expect(quotationUrl).not.toBe("");
  await registerAgency(page, "Rival Agency");
  await page.goto(quotationUrl);
  await expect(page.getByText("Quotation not found")).toBeVisible();
  await page.goto("/quotations");
  await expect(page.getByText("No quotations yet")).toBeVisible();
});

test("unauthenticated visitors are sent to sign in", async ({ page }) => {
  await page.goto("/invoices");
  await expect(page).toHaveURL(/\/login\?next=%2Finvoices/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
