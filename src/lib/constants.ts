/* PI — shared domain constants */

export const ROLES = {
  student: { label: "Student", mark: "S" },
  teacher: { label: "Teacher", mark: "T" },
  researcher: { label: "Researcher", mark: "R" },
  professional: { label: "Professional", mark: "P" },
  entrepreneur: { label: "Entrepreneur", mark: "E" },
  developer: { label: "Developer", mark: "D" },
  creator: { label: "Creator", mark: "C" },
  institution: { label: "Institution", mark: "I" },
} as const;

export type RoleKey = keyof typeof ROLES;

export const INTERESTS = [
  "AI & Machine Learning",
  "Climate Science",
  "Neuroscience",
  "Quantum Computing",
  "Bioengineering",
  "Mathematics",
  "Design",
  "Education",
  "Entrepreneurship",
  "Space & Astronomy",
  "Public Policy",
  "Data Science",
  "Health & Medicine",
  "Robotics",
  "Economics",
  "Psychology",
  "Energy",
  "Cybersecurity",
  "Arts & Media",
  "Philosophy",
  "Law",
  "Linguistics",
  "Materials Science",
  "Physics",
] as const;

export const GOALS = [
  "Learn",
  "Network",
  "Research",
  "Find opportunities",
  "Build my career",
  "Collaborate",
  "Share knowledge",
] as const;

export const REACTIONS = {
  insightful: "Insightful",
  appreciate: "Appreciate",
  curious: "Curious",
} as const;

export type ReactionType = keyof typeof REACTIONS;

export const POST_KINDS = {
  post: { label: "Post" },
  article: { label: "Article" },
  research: { label: "Research Update" },
  achievement: { label: "Achievement", celebrate: true },
  publication: { label: "Publication", celebrate: true },
  job: { label: "New Job", celebrate: true },
  project: { label: "Project" },
  event: { label: "Event" },
  poll: { label: "Poll" },
} as const;

export const ACCENTS: Record<string, { a: string; b: string; c: string }> = {
  aurora: { a: "#8B5CF6", b: "#6366F1", c: "#22D3EE" },
  violet: { a: "#A78BFA", b: "#7C3AED", c: "#4F46E5" },
  cyan: { a: "#22D3EE", b: "#0EA5E9", c: "#6366F1" },
  indigo: { a: "#818CF8", b: "#4F46E5", c: "#8B5CF6" },
  mint: { a: "#5EEAD4", b: "#14B8A6", c: "#6366F1" },
  amber: { a: "#FBBF24", b: "#F59E0B", c: "#8B5CF6" },
  rose: { a: "#FDA4AF", b: "#E11D48", c: "#7C3AED" },
};

export const APP_NAME = "PI";
export const APP_TAGLINE = "Verified Social Intelligence Network";
