#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { generateEmbedding } from "../src/lib/embeddings";

interface ContentChunk {
  slug: string;
  title: string;
  content: string;
}

interface EmbeddingChunk extends ContentChunk {
  embedding: number[];
}

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

/**
 * Extract homepage content
 */
function extractHomepageContent(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "src/data/home.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const content = `${data.introduction.greeting} ${data.introduction.description}. ${data.introduction.chatPrompt}. ${data.introduction.escalation.text} ${data.introduction.escalation.linkText} (${data.escalationLink.href}) ${data.introduction.escalation.suffix}. I'm a self-taught senior software engineer with full-stack experience based in Houston, Texas. This is my portfolio homepage with introduction and welcome message. You can chat with Oscar AI for questions and answers. For escalations, connect with me on LinkedIn.`;

  return [
    {
      slug: "/",
      title: "Homepage - About Oscar",
      content,
    },
  ];
}

/**
 * Extract privacy policy content
 */
function extractPrivacyContent(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "src/data/privacy.md");

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs
    .readFileSync(filePath, "utf-8")
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return [
    {
      slug: "/privacy",
      title: "Privacy Policy",
      content,
    },
  ];
}

/**
 * Extract projects data
 */
function extractProjectsData(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "src/data/projects.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return data.projects.map((project: any) => {
    const projectText = `Project name: ${project.name}. ${project.description}. Technologies used: ${project.tags.join(", ")}. I built ${project.name} using ${project.tags.join(", ")}. This project demonstrates my expertise in ${project.tags.slice(0, 3).join(", ")}.`;

    const linksText =
      project.links && project.links.length > 0
        ? ` Links: ${project.links.map((link: any) => `${link.name}: ${link.href}`).join(" | ")}`
        : "";

    return {
      slug: `projects:${toKebabCase(project.name)}`,
      title: `Project: ${project.name}`,
      content: projectText + linksText,
    };
  });
}

/**
 * Extract career data
 */
function extractCareerData(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "src/data/career.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  return data.career.map((job: any) => {
    const period = job.end ? `${job.start} to ${job.end}` : `${job.start} to present`;
    const descriptions = job.description.join(" ");

    const content = `I worked at ${job.name} as a ${job.title} from ${period}. ${descriptions}. My role at ${job.name} was ${job.title}. This experience contributed to my professional growth as a software engineer.`;

    return {
      slug: `career:${toKebabCase(job.name)}-${toKebabCase(job.title)}`,
      title: `Career: ${job.name} - ${job.title}`,
      content,
    };
  });
}

/**
 * Extract socials data
 */
function extractSocialsData(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "src/data/socials.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const socialsContent = data.socials
    .map((social: any) => {
      let description = "";
      switch (social.name) {
        case "LinkedIn":
          description = " - Connect professionally and view my resume";
          break;
        case "GitHub":
          description = " - Explore my code repositories and projects";
          break;
        case "Email":
          description = " - Preferred communication, send me a direct email";
          break;
      }
      return `${social.name}: ${social.href}${description}`;
    })
    .join(" | ");

  return [
    {
      slug: "socials:links",
      title: "Contact Information and Social Links",
      content: `You can contact Oscar through the following channels: ${socialsContent}. Email is my preferred method for direct communication. Connect with me professionally on LinkedIn. My GitHub contains all my code repositories and projects.`,
    },
  ];
}

/**
 * Extract navigation/routes data
 */
function extractNavigationData(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "src/data/routes.json");

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const navigationContent = data.routes
    .map((route: any) => `'${route.path}' - ${route.name}: ${route.description}`)
    .join(" | ");

  const externalLinks = data.externalLinks
    ?.map((link: any) => `'${link.path}' - ${link.name}: ${link.description}`)
    .join(" | ");

  return [
    {
      slug: "navigation:routes",
      title: "Website Navigation",
      content: `This website has the following pages: ${navigationContent}. ${externalLinks ? `External links: ${externalLinks}` : ""} You can navigate to different sections like projects, blog, and contact.`,
    },
  ];
}

/**
 * Clean LaTeX content by removing commands and formatting
 */
function cleanLatex(text: string): string {
  return text
    .replace(/\\textbf\{([^}]+)\}/g, "$1") // Remove \textbf{}
    .replace(/\\textit\{([^}]+)\}/g, "$1") // Remove \textit{}
    .replace(/\\href\{[^}]+\}\{([^}]+)\}/g, "$1") // Extract link text from \href{}{}
    .replace(/\\item\s*/g, "• ") // Convert \item to bullet
    .replace(/\\hfill/g, " - ") // Replace \hfill with dash
    .replace(/\\itemsep\s*-?\d+pt\s*\{\}/g, "") // Remove itemsep
    .replace(/\\\\/g, " ") // Remove line breaks
    .replace(/\$\$[\s\S]*?\$\$/g, "") // Remove math mode blocks
    .replace(/\\begin\{[^}]+\}/g, "") // Remove \begin{}
    .replace(/\\end\{[^}]+\}/g, "") // Remove \end{}
    .replace(/\\[a-zA-Z]+/g, "") // Remove remaining commands
    .replace(/[{}]/g, "") // Remove braces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Extract resume content from LaTeX file
 */
function extractResumeContent(): ContentChunk[] {
  const filePath = path.join(process.cwd(), "public/resume.tex");

  if (!fs.existsSync(filePath)) {
    console.log("Resume file not found, skipping resume extraction");
    return [];
  }

  const latex = fs.readFileSync(filePath, "utf-8");
  const chunks: ContentChunk[] = [];

  // Extract name
  const nameMatch = latex.match(/\\name\{([^}]+)\}/);
  const name = nameMatch ? nameMatch[1] : "Oscar Mejia";

  // Extract contact info
  const addressMatches = latex.match(/\\address\{([^}]+)\}/g);
  const contactInfo = addressMatches
    ? addressMatches.map((a) => a.replace(/\\address\{|\}/g, "")).join(" | ")
    : "";

  // Extract skills section
  const skillsMatch = latex.match(
    /\\begin\{rSection\}\{SKILLS\}([\s\S]*?)\\end\{rSection\}/,
  );
  if (skillsMatch) {
    const skillsContent = cleanLatex(skillsMatch[1]);
    // Parse the tabular content for skills
    const skillLines = skillsContent
      .split("•")
      .filter((s) => s.trim())
      .join(". ");

    // Extract specific skill categories from the raw LaTeX
    const languagesMatch = skillsMatch[1].match(
      /Languages\}\s*&\s*([^\\]+)/,
    );
    const frontendMatch = skillsMatch[1].match(/Frontend\}\s*&\s*([^\\]+)/);
    const backendMatch = skillsMatch[1].match(/Backend\}\s*&\s*([^\\]+)/);
    const toolsMatch = skillsMatch[1].match(/Tools\}\s*&\s*([^\\]+)/);

    const languages = languagesMatch ? cleanLatex(languagesMatch[1]) : "";
    const frontend = frontendMatch ? cleanLatex(frontendMatch[1]) : "";
    const backend = backendMatch ? cleanLatex(backendMatch[1]) : "";
    const tools = toolsMatch ? cleanLatex(toolsMatch[1]) : "";

    chunks.push({
      slug: "resume:skills",
      title: "Resume - Technical Skills",
      content: `${name}'s technical skills from resume. Programming Languages: ${languages}. Frontend technologies: ${frontend}. Backend technologies: ${backend}. Tools and platforms: ${tools}. These are the skills listed on my official resume.`,
    });
  }

  // Extract experience section
  const expMatch = latex.match(
    /\\begin\{rSection\}\{EXPERIENCE\}([\s\S]*?)\\end\{rSection\}/,
  );
  if (expMatch) {
    const expContent = expMatch[1];

    // Parse individual job entries using \textbf{Title} pattern
    const jobPattern =
      /\\textbf\{([^}]+)\}\s*\\hfill\s*([^\\]+)\\\\[\s\n]*([^\\]+)\s*\\hfill\s*\\textit\{([^}]+)\}[\s\n]*\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g;

    let match;
    while ((match = jobPattern.exec(expContent)) !== null) {
      const title = match[1].trim();
      const dates = match[2].trim();
      const company = match[3].trim();
      const location = match[4].trim();
      const itemsRaw = match[5];

      // Extract bullet points
      const items = itemsRaw
        .split(/\\item/)
        .filter((item) => item.trim())
        .map((item) => cleanLatex(item))
        .filter((item) => item.length > 0);

      const bulletPoints = items.join(" ");
      const slug = `resume:${toKebabCase(company.split("(")[0].trim())}`;

      chunks.push({
        slug,
        title: `Resume - ${company} Experience`,
        content: `${name} worked as ${title} at ${company} in ${location} from ${dates}. Resume bullet points: ${bulletPoints}. This is detailed work experience from my official resume.`,
      });
    }
  }

  // Add a general resume overview chunk
  chunks.push({
    slug: "resume:overview",
    title: "Resume - Overview",
    content: `${name}'s resume overview. Contact: ${cleanLatex(contactInfo)}. I am a Senior Software Engineer based in Houston, TX. US Citizen. My resume is available for download at /resume.pdf. The resume contains my technical skills, work experience at CVS Health, Freelance projects, and Poetic agency work.`,
  });

  return chunks;
}

/**
 * Main function to generate embeddings
 */
async function generateEmbeddings(): Promise<void> {
  console.log("🚀 Starting embedding generation with Transformers.js");
  console.log("📦 Using model: Xenova/all-MiniLM-L6-v2 (100% free, local)");
  console.log(
    "⏬ First run will download ~25MB model, subsequent runs use cache\n",
  );

  console.log("Extracting content from data files...");

  const chunks: ContentChunk[] = [
    ...extractHomepageContent(),
    ...extractPrivacyContent(),
    ...extractProjectsData(),
    ...extractCareerData(),
    ...extractSocialsData(),
    ...extractNavigationData(),
    ...extractResumeContent(),
  ];

  console.log(`Found ${chunks.length} content chunks\n`);

  const embeddingsWithVectors: EmbeddingChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[${i + 1}/${chunks.length}] Embedding: ${chunk.title}`);

    try {
      const embedding = await generateEmbedding(chunk.content);
      embeddingsWithVectors.push({
        ...chunk,
        embedding,
      });
    } catch (error) {
      console.error(`Failed to embed "${chunk.title}":`, error);
      throw error;
    }
  }

  // Write embeddings to file
  const outputPath = path.join(process.cwd(), "src/data/embeddings.json");
  fs.writeFileSync(outputPath, JSON.stringify(embeddingsWithVectors, null, 2), "utf-8");

  console.log(`\nEmbeddings saved to: ${outputPath}`);
  console.log(`Total chunks: ${embeddingsWithVectors.length}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

// Run the script
generateEmbeddings().catch((error) => {
  console.error("Failed to generate embeddings:", error);
  process.exit(1);
});

