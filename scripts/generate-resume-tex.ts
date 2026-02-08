#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { careerSchema } from "../src/lib/schemas";

const PLACEHOLDER = "{{EXPERIENCE}}";
const DEFAULT_LOCATION = "Houston, TX";

/**
 * Escape LaTeX-special characters in a string (for use in body text).
 * Order chosen to avoid double-escaping.
 */
function escapeLatex(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\$/g, "\\$")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

function buildExperienceSection(career: { career: Array<{
  name: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string[];
}> }): string {
  const blocks: string[] = [];

  for (const job of career.career) {
    const title = escapeLatex(job.title);
    const company = escapeLatex(job.name);
    const location = escapeLatex(job.location ?? DEFAULT_LOCATION);
    const dateRange = job.end
      ? `${job.start} - ${job.end}`
      : `${job.start} - present`;

    const header = `\\textbf{${title}} \\hfill ${dateRange}\\\\`;
    const subheader = `${company} \\hfill \\textit{${location}}`;
    const itemizeStart = ` \\begin{itemize}\n    \\itemsep -4pt {} \n`;

    const bullets = (job.description ?? [])
      .map((d) => `    \\item ${escapeLatex(d)}`)
      .join("\n");

    const itemizeEnd = "\n\n\\end{itemize}";

    const block = `${header}\n${subheader}\n${itemizeStart}${bullets}${itemizeEnd}`;
    blocks.push(block);
  }

  return blocks.join("\n \n");
}

function main(): void {
  const careerPath = path.join(process.cwd(), "src/data/career.json");
  const templatePath = path.join(process.cwd(), "public/resume-template.tex");
  const outputPath = path.join(process.cwd(), "public/resume.tex");

  if (!fs.existsSync(careerPath)) {
    console.error("❌ Missing src/data/career.json");
    process.exit(1);
  }
  if (!fs.existsSync(templatePath)) {
    console.error("❌ Missing public/resume-template.tex");
    process.exit(1);
  }

  const careerRaw = JSON.parse(fs.readFileSync(careerPath, "utf-8"));
  const career = careerSchema.parse(careerRaw);
  const template = fs.readFileSync(templatePath, "utf-8");

  const experienceBlock = buildExperienceSection(career);

  if (!template.includes(PLACEHOLDER)) {
    console.error("❌ Template must contain {{EXPERIENCE}} placeholder");
    process.exit(1);
  }

  const output = template.replace(PLACEHOLDER, experienceBlock);
  fs.writeFileSync(outputPath, output, "utf-8");
  console.log("✅ Wrote public/resume.tex from career.json");
}

main();
