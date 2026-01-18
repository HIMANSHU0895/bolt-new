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

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "Return either node or react based on what you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 10,
    });

    const answer =
      completion.choices[0]?.message?.content?.trim().toLowerCase();

    if (answer === "react") {
      return res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.
Consider the contents of ALL files in the project.

${reactBasePrompt}

Here is a list of files that exist on the file system but are not being shown to you:

  - .gitignore
  - package-lock.json
`,
        ],
        uiPrompts: [reactBasePrompt],
      });
    }

    if (answer === "node") {
      return res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.
Consider the contents of ALL files in the project.

${nodeBasePrompt}

Here is a list of files that exist on the file system but are not being shown to you:

  - .gitignore
  - package-lock.json
`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
    }

    return res.status(403).json({ message: "You cant access this" });
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
