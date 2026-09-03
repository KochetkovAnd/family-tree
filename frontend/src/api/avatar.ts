// Single source of truth for the gender colors, so the placeholder photo and
// the always-on card accent (PersonNode.vue) can't drift apart.
export function genderColor(gender: 'MALE' | 'FEMALE'): string {
  return gender === 'MALE' ? '#3b6ea5' : '#b5548a'
}

// Generates a placeholder "photo" so seeded/newly-created people always have
// something to show on the tree — stands in for a real uploaded photo file.
export function generateAvatarDataUrl(initials: string, gender: 'MALE' | 'FEMALE'): string {
  const bg = genderColor(gender)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${bg}"/>
    <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="system-ui, sans-serif"
      font-size="76" fill="#ffffff">${initials}</text>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}
