export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Please complete the form correctly.",
  invalid_email: "That email address doesn't look right.",
  invalid_username: "Username must be 3–20 characters: lowercase letters, numbers, underscores.",
  password_short: "Password must be at least 8 characters.",
  credentials: "Incorrect credentials. Try again.",
  exists: "That email or username is already registered.",
  registration_failed: "We couldn't create your account right now. Please try again shortly.",
  signed_out: "Your session ended. Please sign in again.",
  role_required: "Choose the role that fits you best.",
  interests_required: "Pick at least two interests so PI can personalize your home.",
  goals_required: "Tell us at least one thing you want from PI.",
  too_many_requests: "Too many attempts. Please wait a minute and try again.",
};

export function authErrorMessage(code?: string | null) {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}
