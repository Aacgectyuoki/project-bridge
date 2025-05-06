import { z } from "zod";

export const SkillsSchema = z.object({
  technical: z.array(z.string()).default(() => []),
  soft: z.array(z.string()).optional(), // Soft skills are now optional
  tools: z.array(z.string()).default(() => []),
  frameworks: z.array(z.string()).default(() => []),
  languages: z.array(z.string()).default(() => []),
  databases: z.array(z.string()).default(() => []),
  methodologies: z.array(z.string()).default(() => []),
  platforms: z.array(z.string()).default(() => []),
  other: z.array(z.string()).default(() => []),
}).strict();

// Ensure all fields are strictly `string[]` without `undefined`
export const TransformedSkillsSchema = SkillsSchema.transform((data) => ({
  technical: data.technical ?? [],
  tools: data.tools ?? [],
  frameworks: data.frameworks ?? [],
  languages: data.languages ?? [],
  databases: data.databases ?? [],
  methodologies: data.methodologies ?? [],
  platforms: data.platforms ?? [],
  other: data.other ?? [],
}));

export type ExtractedSkills = z.infer<typeof SkillsSchema>;