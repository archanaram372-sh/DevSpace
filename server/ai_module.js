// ai_module.js
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: ".env.api" });

const apiKey = process.env.GOOGLE_API_KEY || "";

if (!apiKey) {
  console.warn(
    "Warning: GOOGLE_API_KEY is not set. AI analysis will fail without a valid key."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const analyzeCode = async (req, res) => {
  const { code, language, fileName } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  const prompt = `
Act as a senior developer. Analyze this ${language} code from '${fileName}'.
1. What does it do? (1 sentence)
2. Any bugs or risks?
3. One way to improve it.
Keep it short for a terminal.

CODE:
${code}
`;

  try {
    const result = await model.generateContent(prompt);

    // Log raw response for debugging
    console.log("Raw Gemini response:", JSON.stringify(result, null, 2));

    const analysis =
      typeof result.response?.text === "function"
        ? result.response.text()
        : result?.response?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "No response from AI";

    res.json({ analysis });
  } catch (error) {
    console.error("AI Error:", error);
    // Send friendly fallback message
    res.status(500).json({
      error: "AI analysis failed",
      details: error.message,
      fallback:
        "AI is temporarily unavailable. Please try again later or check your API key.",
    });
  }
};