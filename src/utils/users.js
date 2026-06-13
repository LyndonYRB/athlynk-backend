export function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

export function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(parseList);

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatPhotoUrl(req, url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getBaseUrl(req)}${url.startsWith("/") ? url : `/${url}`}`;
}

export function toPublicUserCard(req, user, distanceMiles = 3) {
  const profile = user.profile || {};
  const photos = (user.photos || [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((photo) => formatPhotoUrl(req, photo.url))
    .filter(Boolean);

  const primaryInterest = profile.interests?.[0] || "training";

  return {
    id: user.id,
    name: profile.name || "Athlete",
    age: profile.age,
    subtitle: `${primaryInterest.charAt(0).toUpperCase()}${primaryInterest.slice(1)} training partner`,
    distance: `${distanceMiles} miles away`,
    location: profile.location || "",
    bio: profile.bio || "",
    photos,
    interests: profile.interests || [],
    skill: profile.skill || "",
    availability: profile.availability || [],
  };
}

export function getOtherUserId(connection, currentUserId) {
  return connection.requesterId === currentUserId
    ? connection.recipientId
    : connection.requesterId;
}
