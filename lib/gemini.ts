import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_AI_API_KEY!;

if (!API_KEY) {
  console.warn(
    "GOOGLE_AI_API_KEY is not defined. AI features will be disabled.",
  );
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface GenerateSetOptions {
  type: "swimming" | "land";
  focus?: string;
  previousSets: string[]; // REQUIRED: Recent sets for learning style
}

export async function generateTrainingSet(
  options: GenerateSetOptions,
): Promise<string> {
  if (!API_KEY) {
    throw new Error("Google AI API key is not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const { type, focus, previousSets } = options;

  // Build context from previous sets
  const previousSetsContext =
    previousSets.length > 0
      ? `Here are our recent training sets that you should learn from and match the style:

${previousSets
  .map(
    (set, idx) => `--- Set ${idx + 1} ---
${set}
`,
  )
  .join("\n")}

---`
      : "";

  const prompt = `You are helping create a ${type} training set for University of Moratuwa Swimming Team.

${previousSetsContext}

IMPORTANT INSTRUCTIONS:
1. Study the format, structure, and style of the previous sets above
2. Match the terminology and abbreviations used (FR, BK, BR, FL, IM, etc.)
3. Keep the same difficulty level and progression pattern
4. Use the same time intervals and distances that the coach typically uses
5. Follow the same section structure (warmup, main set, cool down, etc.)
${focus ? `6. Focus this set on: ${focus}` : ""}

Generate a NEW training set that:
- Feels like it was written by the same coach
- Maintains consistency with previous sets
- Is fresh but follows the established patterns
- Uses similar rest intervals and progressions
- Matches the formatting style exactly

Type: ${type === "swimming" ? "Swimming Pool Training" : "Land/Dryland Training"}

Generate the training set now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Error generating training set:", error);
    throw new Error("Failed to generate training set. Please try again.");
  }
}

export async function improveSetDescription(
  originalSet: string,
): Promise<string> {
  if (!API_KEY) {
    throw new Error("Google AI API key is not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Improve and format this swimming/training set to make it clearer and more structured:

${originalSet}

Make it:
- Well-formatted with proper structure
- Clear and easy to follow
- Professional looking
- Include proper swimming terminology
- Keep the same exercises but improve presentation`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Error improving set:", error);
    throw new Error("Failed to improve set description.");
  }
}

// Rate limiting helper (Google AI free tier: 15 RPM, 1500 RPD)
let requestCount = 0;
let requestResetTime = Date.now() + 60000; // Reset every minute

export function checkRateLimit(): boolean {
  const now = Date.now();

  if (now > requestResetTime) {
    requestCount = 0;
    requestResetTime = now + 60000;
  }

  if (requestCount >= 15) {
    return false; // Rate limit exceeded
  }

  requestCount++;
  return true;
}
