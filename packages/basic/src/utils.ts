import { CityTile, Position, Cell, Cargo, Unit } from "@lux-ai-bots/lux-sdk";
import { PosId } from "./typings";
import fs from "fs/promises";

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

export const unitHasEnoughResourceToBuildCity = (unit: Unit) =>
  cargoTotalLoad(unit.cargo) >= 100;

export const logTo = (path: string) => (str: string) => fs.appendFile(path, str + "\n");

