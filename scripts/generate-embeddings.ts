#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import { generateEmbedding } from "../src/lib/embeddings";

// Load environment variables from .env.local
config({ path: ".env.local" });

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

  const content = `${data.introduction.greeting} ${data.introduction.description}. ${data.introduction.chatPrompt}. ${data.introduction.escalation.text} ${data.introduction.escalation.linkText} (${data.escalationLink.href}) ${data.introduction.escalation.suffix}. I'm a  senior software engineer with full-stack experience based in Houston, Texas. This is my portfolio homepage with introduction and welcome message. You can chat with Oscar AI for questions and answers. For escalations, connect with me on LinkedIn.`;

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
    const period = job.end
      ? `${job.start} to ${job.end}`
      : `${job.start} to present`;
    const descriptions = job.description.join(" ");

    const content = `I worked at ${job.name} as a ${job.title} from ${period}. ${descriptions}. My role at ${job.name} was ${job.title}. Projects and work I did at ${job.name} are part of my professional experience as a software engineer.`;

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
    .map(
      (route: any) => `'${route.path}' - ${route.name}: ${route.description}`,
    )
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
 * Extract resume skills and overview content.
 * Skills and contact info are static; experience is already covered by extractCareerData().
 */
function extractResumeContent(): ContentChunk[] {
  const name = "Oscar Mejia";

  const skills = {
    languages: "TypeScript, JavaScript (Node.js), HTML5, CSS",
    frontend: "React, Next.js, React Query, Stencil.js, Redux, Tailwind, A11y",
    backend: "Express, tRPC, GraphQL, REST APIs, PostgreSQL, Ruby on Rails",
    tools:
      "Docker, Google Cloud, Splunk, Git, Jest, MSW, Playwright, Biome, Git, Github, Docker, Charles Proxy, Claude Code, Cursor, Storybook",
  };

  return [
    {
      slug: "resume:skills",
      title: "Resume - Technical Skills",
      content: `${name}'s technical skills from resume. Programming Languages: ${skills.languages}. Frontend technologies: ${skills.frontend}. Backend technologies: ${skills.backend}. Tools and platforms: ${skills.tools}. These are the skills listed on my official resume.`,
    },
    {
      slug: "resume:overview",
      title: "Resume - Overview",
      content: `${name}'s resume overview. Contact: (281) 713-0784 | Houston, TX | US Citizen | oscarmejiaweb@gmail.com | linkedin.com/in/oscarmejiabautista | oscarmb.com. I am a Senior Software Engineer based in Houston, TX. US Citizen. My resume is available for download: [resume](/resume.pdf). The resume contains my technical skills, work experience at CVS Health, Freelance projects, and Poetic agency work.`,
    },
  ];
}

/**
 * Main function to generate embeddings
 */
async function generateEmbeddings(): Promise<void> {
  console.log("🚀 Starting embedding generation with Google AI");
  console.log("📦 Using model: gemini-embedding-001 (768 dimensions)");
  console.log(
    "🔑 Requires GOOGLE_GENERATIVE_AI_API_KEY environment variable\n",
  );

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("❌ Error: GOOGLE_GENERATIVE_AI_API_KEY is not set");
    console.error("   Please set it in your .env.local file");
    process.exit(1);
  }

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
  const outputPath = path.join(process.cwd(), "generated/embeddings.json");
  const output = {
    _warning:
      "AUTO-GENERATED FILE — DO NOT EDIT. Regenerate with: pnpm embeddings (see scripts/generate-embeddings.ts).",
    embeddings: embeddingsWithVectors,
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`\nEmbeddings saved to: ${outputPath}`);
  console.log(`Total chunks: ${embeddingsWithVectors.length}`);
  console.log(
    `File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`,
  );
}

// Run the script
generateEmbeddings().catch((error) => {
  console.error("Failed to generate embeddings:", error);
  process.exit(1);
});
