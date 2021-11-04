import { Agent, GameState, Cell, annotate } from "lux";
import { cityTileToUnitRecord, unitToCityTileRecord } from "./store";
import { PosId, ResourceType } from "./typings";
import {
  cargoTotalLoad,
  cellIsEmpty,
  computePosId,
  getCellAtPosId,
  getClosestPos,
  unitCanBuildCity,
} from "./utils";

const agent = new Agent();

export const run = () => {
  agent.run((gameState: GameState): string[] => {
    const player = gameState.players[gameState.id];
    const opponent = gameState.players[(gameState.id + 1) % 2];
    const gameMap = gameState.map;
    const researchedResourceTypes: ResourceType[] = [
      player.researchedCoal() && "coal",
      player.researchedUranium() && "uranium",
      "wood",
    ].filter((e) => !!e) as ResourceType[];
    const researchedResourceCells: Cell[] = gameMap.map
      .flat()
      .filter(
        (tile) =>
          tile.hasResource() &&
          researchedResourceTypes.indexOf(tile.resource.type as ResourceType) >=
            0
      );

    const playerWorkers = player.units.filter((unit) => unit.isWorker());
    const playerCities = Array.from(player.cities.values());
    const playerCityTiles = playerCities.map((city) => city.citytiles).flat();
    const emptyCells: Cell[] = gameMap.map
      .flat()
      .filter((cell) => !cell.resource && !cell.citytile && !cell.road);

    if (playerCityTiles.length === 1 && playerWorkers.length === 1) {
      const [firstWorker] = playerWorkers;
      const [firstCityTile] = playerCityTiles;
      const firstCityTilePosId = computePosId(firstCityTile.pos);

      // @ts-ignore
      cityTileToUnitRecord[firstCityTilePosId] = firstWorker.id;
      unitToCityTileRecord[firstWorker.id] = firstCityTilePosId;
    }

    if (playerWorkers.length > 1) {
      playerWorkers.forEach((worker): void => {
        const workerCell = gameMap.map[worker.pos.x][worker.pos.y];
        const workerCityTile = unitToCityTileRecord[worker.id];
        if (!!workerCell.citytile && !workerCityTile) {
          unitToCityTileRecord[worker.id] = computePosId(worker.pos);
          cityTileToUnitRecord[unitToCityTileRecord[worker.id]] = worker.id;
        }
      });
    }

    const cityTilesActions = playerCityTiles
      .filter((cityTile) => !cityTileToUnitRecord[computePosId(cityTile.pos)])
      .map((cityTile) => cityTile.buildWorker());

    const workersActions = playerWorkers
      .filter((worker) => worker.canAct())
      .flatMap((worker) => {
        const workerCell = gameMap.map[worker.pos.x][worker.pos.y];
        const workerCityTilePosId = unitToCityTileRecord[worker.id];
        const workerCityTileCell = getCellAtPosId({
          posId: workerCityTilePosId,
          mapCells: gameMap.map,
        });

        // annotate.sidetext(`CARGO LEFT : ${worker.getCargoSpaceLeft()}`);
        // console.log(`CARGO LEFT : ${worker.getCargoSpaceLeft()}`);

        if (unitCanBuildCity(worker)) {
          if (worker.canBuild(gameMap)) {
            return [worker.buildCity()];
          } else {
            const { possibility: closestEmptyCellPosition } = getClosestPos({
              origin: worker.pos,
              possibilities: emptyCells.map((cell) => cell.pos),
            });
            const dir = worker.pos.directionTo(closestEmptyCellPosition);
            return [worker.move(dir)];
          }
        }

        if (cargoTotalLoad(worker.cargo) > 0) {
          if (workerCityTileCell.citytile) {
            const cityTile = workerCityTileCell.citytile;
            const city = player.cities.get(cityTile.cityid);
            if (worker.getCargoSpaceLeft() === 0 || (city && city.fuel < 20)) {
              return [worker.move(worker.pos.directionTo(cityTile.pos))];
            }
          }
        }

        const { possibility: closestResourceTilePosition } = getClosestPos({
          origin: worker.pos,
          possibilities: researchedResourceCells.map((cell) => cell.pos),
        });
        const dir = worker.pos.directionTo(closestResourceTilePosition);

        return [worker.move(dir)];
      });

    return [...cityTilesActions, ...workersActions];
  });
};
