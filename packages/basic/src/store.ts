import { CityTileToUnitRecord, PosId, UnitToCityTileRecord } from "./typings";

export const unitToCityTileRecord: UnitToCityTileRecord = {};

export const cityTileToUnitRecord: CityTileToUnitRecord = {};

export function purgeStore(params: {
  unitIds: string[],
  cityTilePosIds: PosId[]
}): void {
  const { unitIds, cityTilePosIds } = params;
  Object.entries(unitToCityTileRecord).forEach(([key, value]) => {
    if (!unitIds.includes(key) || !cityTilePosIds.includes(value)) {
      delete unitToCityTileRecord[key];
    }
  });
  Object.entries(cityTileToUnitRecord).forEach(([key, value]: any) => {
    if (!unitIds.includes(value) || !cityTilePosIds.includes(key)) {
      delete cityTileToUnitRecord[key];
    }
  });
}