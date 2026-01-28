import "dotenv/config";
import express from "express";
import cors from "cors";
import { Groq } from "groq-sdk";

import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

const app = express();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(cors());
app.use(express.json());

/**
 * Decide whether project should be Node or React
 */
app.post("/template", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({ error: "Prompt missing" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      max_tokens: 5,
      messages: [
        { role: "system", content: "Classify the project. Reply with exactly ONE word: react or node. No punctuation. No explanation." },
        { role: "user", content: prompt }
      ]
    });

    console.log("GROQ FULL RESPONSE:", JSON.stringify(completion, null, 2));

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const answer = raw.trim().toLowerCase();

    if (answer.includes("react")) {
      return res.json({ prompts: [BASE_PROMPT, reactBasePrompt], uiPrompts: [reactBasePrompt] });
    }

    if (answer.includes("node")) {
      return res.json({ prompts: [BASE_PROMPT, nodeBasePrompt], uiPrompts: [nodeBasePrompt] });
    }

    return res.status(422).json({ error: "Unable to classify project type", llmResponse: answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Groq request failed" });
  }
});


/**
 * Main chat endpoint
 */
app.post("/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        ...messages,
      ],
      max_tokens: 8000,
    });

    res.json({
      response: completion.choices[0]?.message?.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Groq chat failed" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
