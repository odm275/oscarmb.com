import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import * as Sentry from "@sentry/nextjs";
import { generateEmbedding } from "@/lib/embeddings";
import { formatContext, retrieveContext } from "@/lib/rag";

// Uses default Node runtime for Google AI SDK

const SYSTEM_PROMPT = `You are Oscar's AI assistant on his portfolio website. You help visitors learn about Oscar's background, skills, projects, and experience.

Guidelines:
- Be friendly, professional, and concise
- Answer questions based on the provided context about Oscar
- If asked something not covered in the context, politely say you don't have that information
- When relevant, suggest visitors check out specific pages like /projects or /contact
- Keep responses focused and helpful
- Use markdown formatting when appropriate (lists, bold, links)

Context about Oscar:
`;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Get the last user message for embedding
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: "No user message found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract text from the message (Vercel AI SDK v6 UIMessage format)
    // UIMessage has a "parts" array with typed content
    const textPart = lastUserMessage.parts.find(
      (part): part is Extract<typeof part, { type: "text" }> =>
        part.type === "text",
    );

    const messageText = textPart?.text || "";

    if (!messageText) {
      return new Response(
        JSON.stringify({ error: "No text content in message" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Embed the user's query using Google's gemini-embedding-001
    const embedding = await generateEmbedding(messageText);

    // Retrieve relevant context from pre-generated embeddings
    const relevantChunks = retrieveContext(embedding, 3);
    const context = formatContext(relevantChunks);

    // Check if Google API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Google API key not configured",
          detail:
            "Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Convert UIMessage[] to ModelMessage[] for streamText
    const coreMessages = await convertToModelMessages(messages);

    // Stream the response using Google Gemini (FREE tier: 1500 requests/day!)
    const result = streamText({
      model: google("gemini-2.5-flash-lite"), // Gemini 2.5 Flash Lite - fastest and most cost-efficient
      system: SYSTEM_PROMPT + context,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[API Chat Route Error]", error);

    // Capture the error in Sentry with additional context
    Sentry.captureException(error, {
      tags: {
        route: "/api/chat",
      },
    });

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: "Internal Server Error", detail: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
