const WALK_STREETS = new Set([
  "primary",
  "secondary",
  "tertiary",
  "unclassified",
  "residential",
  "living_street",
  "pedestrian",
  "road",
]);
const DRIVE_BLOCKED = new Set(["pedestrian", "footway", "path", "cycleway", "steps", "bridleway"]);
const DENIED = new Set(["private", "no"]);
const ALLOWED = new Set(["yes", "designated", "permissive"]);

export function eligibleModes(tags) {
  const highway = tags.highway;
  if (!highway || tags.area === "yes" || tags.proposed || tags.construction) return [];
  if (highway === "service" && (!tags.name || ["driveway", "parking_aisle"].includes(tags.service))) return [];
  const generalDenied = DENIED.has(tags.access);
  const footAllowed = ALLOWED.has(tags.foot);
  const motorAllowed = ALLOWED.has(tags.motor_vehicle) || ALLOWED.has(tags.motorcar);
  const footDenied = DENIED.has(tags.foot) || (generalDenied && !footAllowed);
  const motorDenied =
    DENIED.has(tags.motor_vehicle) || DENIED.has(tags.motorcar) || (generalDenied && !motorAllowed);
  const walkClass = WALK_STREETS.has(highway) || highway === "service" || footAllowed;
  const driveClass = (!DRIVE_BLOCKED.has(highway) && highway !== "service") || highway === "service" || motorAllowed;
  return [walkClass && !footDenied ? "walk" : null, driveClass && !motorDenied ? "drive" : null].filter(Boolean);
}
