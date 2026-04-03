#!/usr/bin/env node

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { ResumeDocument } from "../src/components/resume/ResumeDocument";
import { careerSchema } from "../src/lib/schemas";

const FONT_CSS_URL =
  "https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css";
const TAILWIND_CDN_URL = "https://cdn.tailwindcss.com";

function wrapHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="${FONT_CSS_URL}" />
  <script src="${TAILWIND_CDN_URL}"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['"Computer Modern Serif"', 'serif'],
          },
        },
      },
    };
  </script>
  <style>
    body {
      font-family: "Computer Modern Serif", serif;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    a { text-decoration: none; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

async function main(): Promise<void> {
  const careerPath = path.join(process.cwd(), "src/data/career.json");
  const outputPath = path.join(process.cwd(), "public/resume.pdf");

  if (!fs.existsSync(careerPath)) {
    console.error("❌ Missing src/data/career.json");
    process.exit(1);
  }

  const careerRaw = JSON.parse(fs.readFileSync(careerPath, "utf-8"));
  const { career } = careerSchema.parse(careerRaw);

  const bodyHtml = renderToStaticMarkup(
    createElement(ResumeDocument, { career }),
  );
  const fullHtml = wrapHtml(bodyHtml);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "resume-"));
  const tmpFile = path.join(tmpDir, "resume.html");

  try {
    fs.writeFileSync(tmpFile, fullHtml, "utf-8");

    let browser;
    try {
      browser = await chromium.launch();
    } catch {
      console.error(
        "❌ Could not launch Chromium. Install Playwright browsers:\n" +
          "   npx playwright install chromium",
      );
      process.exit(1);
    }

    const page = await browser.newPage();
    await page.goto(`file://${tmpFile}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    await page.pdf({
      path: outputPath,
      format: "Letter",
      margin: {
        top: "0.3in",
        right: "0.3in",
        bottom: "0.3in",
        left: "0.3in",
      },
      printBackground: true,
    });

    await browser.close();
    console.log("✅ Wrote public/resume.pdf");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("❌ Failed to generate resume PDF:", err);
  process.exit(1);
});
