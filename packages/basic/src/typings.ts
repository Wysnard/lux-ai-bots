import { Position, Unit } from "lux";

export type PosId = `${Position["x"]}_${Position["y"]}`;

export type UnitToCityTileRecord = Record<Unit["id"], PosId>;

export type CityTileToUnitRecord = Record<PosId, Unit["id"]>;

export type ResourceType = "wood" | "coal" | "uranium";
