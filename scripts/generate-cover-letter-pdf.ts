#!/usr/bin/env node

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { chromium } from "@playwright/test";

const FONT_CSS_URL =
  "https://cdn.jsdelivr.net/gh/dreampulse/computer-modern-web-font@master/fonts.css";

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="${FONT_CSS_URL}" />
  <style>
    body {
      font-family: "Computer Modern Serif", serif;
      font-size: 11pt;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 640px;
      margin: 0 auto;
      padding: 48pt 0;
    }
    .name {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 4pt;
    }
    .contact {
      text-align: center;
      font-size: 10pt;
      margin-bottom: 36pt;
    }
    p {
      margin: 0 0 14pt 0;
    }
    .closing {
      margin-top: 24pt;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="name">OSCAR MEJIA</div>
    <div class="contact">oscarmejiaweb@gmail.com &nbsp;&middot;&nbsp; (281) 713-0784 &nbsp;&middot;&nbsp; oscarmb.com</div>

    <p>Dear Hiring Manager,</p>

    <p>
      The engineers I have learned the most from were never the ones with the most answers.
      They were the ones who asked better questions earlier, who slowed down when something
      felt off, and who thought about the people on the other side of every technical decision.
      That is the kind of engineer I have worked to become.
    </p>

    <p>
      I care about getting it right more than I care about getting it done fast. That has meant
      pushing back on API designs before they became production problems, designing packages
      around the teams consuming them rather than just the immediate use case, and being honest
      when the right call is to go back to the drawing board. It has also meant staying curious
      &mdash; right now I am genuinely excited about what AI-assisted development makes possible
      when applied with real engineering judgment, not just as a shortcut.
    </p>

    <p>
      I would love to bring that mindset to your team. If it resonates, I am happy to talk.
    </p>

    <div class="closing">
      <p>Sincerely,<br />Oscar Mejia</p>
    </div>
  </div>
</body>
</html>`;

async function main(): Promise<void> {
  const outputPath = path.join(process.cwd(), "public/cover-letter.pdf");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cover-letter-"));
  const tmpFile = path.join(tmpDir, "cover-letter.html");

  try {
    fs.writeFileSync(tmpFile, html, "utf-8");

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
        top: "0.75in",
        right: "1in",
        bottom: "0.75in",
        left: "1in",
      },
      printBackground: true,
    });

    await browser.close();
    console.log("✅ Wrote public/cover-letter.pdf");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("❌ Failed to generate cover letter PDF:", err);
  process.exit(1);
});
