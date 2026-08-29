const ARTERIAL = new Set([
  "motorway", "trunk", "primary", "secondary",
  "motorway_link", "trunk_link", "primary_link", "secondary_link",
]);
const TRAIL = new Set(["path", "footway", "track", "bridleway", "cycleway", "steps", "pedestrian"]);
const DENIED = new Set(["private", "no"]);

export function eligibleForProfile(tags, profile) {
  if (tags.area === "yes" || tags.proposed || tags.construction || DENIED.has(tags.access)) return false;
  if (profile === "arterial") return ARTERIAL.has(tags.highway);
  if (profile === "trail") return TRAIL.has(tags.highway) && !DENIED.has(tags.foot);
  return false;
}
