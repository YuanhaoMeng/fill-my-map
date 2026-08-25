import type { Coordinate } from "../../core/types";

export interface Landmark {
  id: string;
  cityId: "ann-arbor" | "ypsilanti";
  name: string;
  coordinate: Coordinate;
  radiusM: number;
  osm: string;
}

export const landmarks: readonly Landmark[] = [
  landmark("aa-stadium", "ann-arbor", "Michigan Stadium", [-83.7487, 42.2658], "relation/1637002"),
  landmark("aa-diag", "ann-arbor", "The Diag", [-83.7382, 42.2769], "way/176847689"),
  landmark("aa-arb", "ann-arbor", "Nichols Arboretum", [-83.7248, 42.2807], "relation/10391031"),
  landmark("aa-kerrytown", "ann-arbor", "Kerrytown Market", [-83.7466, 42.2847], "way/193502051"),
  landmark("aa-theater", "ann-arbor", "Michigan Theater", [-83.7386, 42.2793], "node/9094921615"),
  landmark("ypsi-tower", "ypsilanti", "Ypsilanti Water Tower", [-83.6178, 42.2407], "way/882710137"),
  landmark("ypsi-depot", "ypsilanti", "Depot Town", [-83.6103, 42.245], "way/1121557325"),
  landmark("ypsi-riverside", "ypsilanti", "Riverside Park", [-83.6122, 42.2442], "way/114540712"),
  landmark("ypsi-firehouse", "ypsilanti", "Michigan Firehouse Museum", [-83.6174, 42.2411], "way/623595835"),
  landmark("ypsi-emu", "ypsilanti", "Eastern Michigan University", [-83.627, 42.251], "relation/6930093"),
];

function landmark(
  id: Landmark["id"],
  cityId: Landmark["cityId"],
  name: string,
  coordinate: Coordinate,
  osm: string,
): Landmark {
  return { id, cityId, name, coordinate, radiusM: 75, osm };
}
