import dotenv from "dotenv";
import Groq from "groq-sdk";

// Load environment variables first
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

async function runChat() {
  // Create a streaming chat completion
  const chatStream = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "user", content: "make a TODO application" }
    ],
    temperature: 1,
    max_completion_tokens: 8192,
    top_p: 1,
    stream: true,            // important for streaming
    reasoning_effort: "medium",
  });

  console.log("Streaming response:\n");

  // Loop over chunks as they arrive
  for await (const chunk of chatStream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) {
      // Output text immediately
      process.stdout.write(text);
    }
  }

  console.log("\n\n✅ Stream finished!");
}

// Run the async function
runChat().catch(console.error);
