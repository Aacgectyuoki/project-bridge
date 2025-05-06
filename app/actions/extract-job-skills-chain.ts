"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { Chain } from "../../utils/ai-chain/chain"
import { OutputParser } from "../../utils/ai-chain/output-parser"
import { jobSkillExtractionPrompt } from "../../utils/ai-chain/prompts/skill-extraction-prompts"
import { SkillsSchema } from "@/utils/ai-chain/schemas/skill-extraction-schema";

// Ensure all fields in SkillsSchema have default values
// const TransformedSkillsSchema = SkillsSchema.transform((data) => ({
//   technical: data.technical ?? [] as string[],
//   tools: data.tools ?? [] as string[],
//   frameworks: data.frameworks ?? [] as string[],
//   languages: data.languages ?? [] as string[],
//   databases: data.databases ?? [] as string[],
//   methodologies: data.methodologies ?? [] as string[],
//   platforms: data.platforms ?? [] as string[],
//   other: data.other ?? [] as string[],
// }));
import type { ExtractedSkills } from "@/utils/ai-chain/schemas/skill-extraction-schema"; // Add this import

// Ensure all fields in SkillsSchema have default values
// const SkillsSchema = OriginalSkillsSchema.transform((data) => ({
//   technical: data.technical ?? [] as string[],
//   tools: data.tools ?? [] as string[],
//   frameworks: data.frameworks ?? [] as string[],
//   languages: data.languages ?? [] as string[],
//   databases: data.databases ?? [] as string[],
//   methodologies: data.methodologies ?? [] as string[],
//   platforms: data.platforms ?? [] as string[],
//   other: data.other ?? [] as string[],
// }));
import { EnhancedSkillsLogger } from "../../utils/enhanced-skills-logger"
import { SkillsLogger } from "../../utils/skills-logger"
import { safeParseJSON, extractJsonFromText } from "../../utils/enhanced-json-repair"
import { withRetry, isRateLimitError } from "../../utils/api-rate-limit-handler"
import { z, ZodType } from "zod"

const GROQ_MODELS = ["llama3-8b-8192", "mixtral-8x7b-32768", "llama3-70b-8192"];

// Default empty skills structure
const defaultSkills: ExtractedSkills = {
  technical: [],
  tools: [],
  frameworks: [],
  languages: [],
  databases: [],
  methodologies: [],
  platforms: [],
  other: []
};

/**
 * Try different models in sequence until one works
 */
async function tryModelsInSequence(
  prompt: string,
  system: string,
  apiKey: string,
): Promise<string> {
  let lastError: Error | null = null; // Declare lastError variable
  for (const model of GROQ_MODELS) {
    try {
      console.log(`Trying model: ${model}`)

      const text = await withRetry(
        async () => {
          const response = await generateText({
            model: groq(model),
            prompt,
            temperature: 0.2,
            maxTokens: 1500, // Reduced from 2048 to stay under rate limits
            system,
          })
          return response.text
        },
        {
          maxRetries: 3,
          initialDelayMs: 3000,
          maxDelayMs: 15000,
        },
      )

      console.log(`Successfully used model: ${model}`)
      return text
    } catch (error) {
      console.warn(`Error with model ${model}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // If it's not a rate limit error, try the next model
      // If it is a rate limit error, the withRetry function already tried with backoff
      if (!isRateLimitError(error)) {
        continue
      }
    }
  }

  // If all models failed, throw the last error
  throw lastError || new Error("All models failed")
}

// Function to extract skills from a job description using our LangChain-like approach
export async function extractJobSkillsChain(jobDescription: string,
  promptOverride?: string,
  systemOverride?: string): Promise<{
  skills: ExtractedSkills
  processingTime: number
}> {

  const getGroqApiKey = () => {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error("Missing GROQ_API_KEY in env")
    return key
  }

  console.log("Starting job skill extraction with LangChain-like approach")
  const startTime = performance.now()

  try {
    // Get the API key from environment variables
    const GROQ_API_KEY = getGroqApiKey()

    // Check if API key is available
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not defined in environment variables")
      throw new Error("Groq API key is missing. Please check your environment variables.")
    }

    const TransformedSkillsSchema = SkillsSchema.transform((data) => {
      return {
        technical: data.technical ?? [],
        tools: data.tools ?? [],
        frameworks: data.frameworks ?? [],
        languages: data.languages ?? [],
        databases: data.databases ?? [],
        methodologies: data.methodologies ?? [],
        platforms: data.platforms ?? [],
        other: data.other ?? []
      };
    });
    
    // OR Solution 2: Use type assertion if you're confident the schema handles defaults correctly
    const skillsParser = new OutputParser<ExtractedSkills>(
      TransformedSkillsSchema as ZodType<ExtractedSkills>,
      "job-skills-parser",
      (text): ExtractedSkills => {
        // Your existing fallback logic
        const extractedJson = extractJsonFromText(text) ?? safeParseJSON(text, defaultSkills);
        
        const parsed = TransformedSkillsSchema.safeParse(extractedJson);
        if (parsed.success) return parsed.data;
        return defaultSkills;
      }
    );
    

    // For now, let's avoid chunking to simplify the process
    // This will help us identify if chunking is causing the freezing issue
    return await extractJobSkillsDirect(jobDescription, skillsParser, GROQ_API_KEY)
  } catch (error) {
    console.error("Error in job skill extraction:", error)

    // Log the error
    EnhancedSkillsLogger.logExtractedSkills(
      jobDescription.substring(0, 200) + "...",
      defaultSkills,
      "job-description-error",
      performance.now() - startTime,
    )

    // Return empty results
    return {
      skills: defaultSkills,
      processingTime: performance.now() - startTime,
    }
  }
}

// Function to extract skills from a job description directly (no chunking)
async function extractJobSkillsDirect(
  jobDescription: string,
  skillsParser: OutputParser<ExtractedSkills>,
  apiKey: string,
): Promise<{
  skills: ExtractedSkills
  processingTime: number
}> {
  const startTime = performance.now()

  // Create our chain
  const chain = new Chain("job-skills-extraction-chain")

  // Add steps to our chain
  chain.addStep(async (input) => {
    // Format the prompt
    const prompt = jobSkillExtractionPrompt.format({ text: input })
    const system =
      "You are a JSON-only response bot. You must ONLY return valid JSON with no explanatory text. Your response must start with '{' and end with '}'."

    try {
      // Try different models in sequence
      const text = await tryModelsInSequence(prompt, system, apiKey)

      // First, try to extract JSON from text that might contain explanatory content
      const extractedJson = extractJsonFromText(text)
      if (extractedJson) {
        console.log("Successfully extracted JSON from response")
        return JSON.stringify(extractedJson)
      }

      return text
    } catch (error) {
      console.error("Error generating text with all models:", error)
      // Return a simple JSON structure that will parse correctly
      return JSON.stringify(defaultSkills)
    }
  }, "generate-skills-text")

  chain.addStep(async (text) => {
    try {
      // Parse the output
      const skills = await skillsParser.parse(text)
      return skills
    } catch (error) {
      console.error("Error parsing skills:", error)

      // Log more details about the parsing error
      if (typeof text === "string") {
        console.error("First 100 characters of problematic text:", text.substring(0, 100))

        // Try to extract JSON from text that might contain explanatory content
        const extractedJson = extractJsonFromText(text)
        if (extractedJson) {
          console.log("Successfully extracted JSON from problematic text")
          return extractedJson
        }

        // Try to identify JSON-like structures
        const jsonMatch = text.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          console.log("Found JSON-like structure, attempting manual repair")
          try {
            // Try to parse the JSON structure
            const parsedSkills = safeParseJSON(jsonMatch[0], defaultSkills)
            console.log("Manual repair succeeded")
            return parsedSkills
          } catch (repairError) {
            console.error("Manual repair failed:", repairError)
          }
        }
      }

      // Return a default skills object
      return defaultSkills
    }
  }, "parse-skills")

  // Run the chain
  const skills = await chain.run(jobDescription)

  const processingTime = performance.now() - startTime

  // Log the extracted skills
  EnhancedSkillsLogger.logExtractedSkills(
    jobDescription.substring(0, 200) + "...",
    skills,
    "job-description",
    processingTime,
  )

  // Also log to the original SkillsLogger for compatibility
  SkillsLogger.logSkills({
    source: "job-description",
    technicalSkills: [
      ...skills.technical,
      ...skills.tools,
      ...skills.frameworks,
      ...skills.languages,
      ...skills.databases,
      ...skills.platforms,
    ],
    softSkills: skills.soft,
    timestamp: new Date().toISOString(),
  })

  return {
    skills,
    processingTime,
  }
}

// Function to extract skills from text content when JSON parsing fails
function extractSkillsFromText(text: string): ExtractedSkills {
  const skills: ExtractedSkills = {
    technical: [],
    soft: [],
    tools: [],
    frameworks: [],
    languages: [],
    databases: [],
    methodologies: [],
    platforms: [],
    other: [],
  }

  // Look for skill lists in the text
  const technicalMatch = text.match(/technical[^[]*\[(.*?)\]/is)
  if (technicalMatch && technicalMatch[1]) {
    skills.technical = extractArrayItems(technicalMatch[1])
  }

  const softMatch = text.match(/soft[^[]*\[(.*?)\]/is)
  if (softMatch && softMatch[1]) {
    skills.soft = extractArrayItems(softMatch[1])
  }

  const toolsMatch = text.match(/tools[^[]*\[(.*?)\]/is)
  if (toolsMatch && toolsMatch[1]) {
    skills.tools = extractArrayItems(toolsMatch[1])
  }

  const frameworksMatch = text.match(/frameworks[^[]*\[(.*?)\]/is)
  if (frameworksMatch && frameworksMatch[1]) {
    skills.frameworks = extractArrayItems(frameworksMatch[1])
  }

  const languagesMatch = text.match(/languages[^[]*\[(.*?)\]/is)
  if (languagesMatch && languagesMatch[1]) {
    skills.languages = extractArrayItems(languagesMatch[1])
  }

  const databasesMatch = text.match(/databases[^[]*\[(.*?)\]/is)
  if (databasesMatch && databasesMatch[1]) {
    skills.databases = extractArrayItems(databasesMatch[1])
  }

  // If we couldn't extract any skills, try a more general approach
  if (Object.values(skills).every((arr) => arr.length === 0)) {
    // Look for any quoted strings that might be skills
    const quotedStrings = text.match(/"([^"]+)"/g)
    if (quotedStrings) {
      // Remove duplicates and clean up
      const uniqueSkills = [...new Set(quotedStrings.map((s) => s.replace(/"/g, "").trim()))]
      skills.technical = uniqueSkills
    }
  }

  return skills
}

// Helper function to extract items from array-like text
function extractArrayItems(text: string): string[] {
  // Remove any nested arrays or objects
  let cleanText = text.replace(/\{[^}]*\}/g, "")
  cleanText = cleanText.replace(/\[[^\]]*\]/g, "")

  // Extract quoted strings
  const items: string[] = []
  const matches = cleanText.match(/"([^"]+)"/g)

  if (matches) {
    matches.forEach((match) => {
      const item = match.replace(/"/g, "").trim()
      if (item && !items.includes(item)) {
        items.push(item)
      }
    })
  }

  // If no quoted strings found, try comma-separated values
  if (items.length === 0) {
    cleanText.split(",").forEach((item) => {
      const trimmed = item.trim()
      if (trimmed && !items.includes(trimmed)) {
        items.push(trimmed)
      }
    })
  }

  return items
}
