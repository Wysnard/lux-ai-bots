import { CityTile, Position, Cell, Cargo, Unit } from "lux";
import { PosId } from "./typings";

export const computePosId = (position: Position): PosId =>
  `${position.x}_${position.x}` as PosId;

export type GetClosestPosParams = {
  origin: Position;
  possibilities: Position[];
};

export const getClosestPos = ({
  origin,
  possibilities,
}: GetClosestPosParams): {
  distance: number;
  possibility: Position;
} =>
  possibilities
    .map((possibility) => ({
      distance: origin.distanceTo(possibility),
      possibility,
    }))
    .reduce((acc, curr) => (curr.distance < acc.distance ? curr : acc), {
      distance: Infinity,
      possibility: new Position(Infinity, Infinity),
    });

export type GetCityTileAtPosIdParams = {
  posId: PosId;
  mapCells: Cell[][];
};

export const parsePosId = (posId: PosId): Position =>
  new Position(
    ...(posId.split("_").map((e): number => parseInt(e, 10)) as [
      number,
      number
    ])
  );

export type GetCellAtPosIdParams = {
  posId: PosId;
  mapCells: Cell[][];
};

export const getCellAtPosId = ({ posId, mapCells }: GetCellAtPosIdParams) => {
  const position = parsePosId(posId);
  return mapCells[position.x][position.y];
};

export const cargoTotalLoad = (cargo: Cargo) =>
  cargo.wood + cargo.coal + cargo.uranium;

export const cellIsEmpty = (cell: Cell) =>
  !cell.resource && !cell.citytile && !cell.road;

export const unitCanBuildCity = (unit: Unit) =>
  cargoTotalLoad(unit.cargo) >= 100;
