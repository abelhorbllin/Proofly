import { chromium } from "playwright-core";

const CHROMIUM_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Renders an HTML string to a PDF buffer using the environment's pre-installed headless Chromium. */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "24px", bottom: "24px", left: "24px", right: "24px" },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
