/**
 * Returns the appropriate default avatar based on gender.
 * - Female → /profile-vatarforgirls.png
 * - Male / Custom / Unknown → /profile-avtar.png
 */
export function getDefaultAvatar(gender?: string): string {
  if (gender === "female") {
    return "/profile -vatarforgirls.png";
  }
  return "/profile-avtar.png";
}
