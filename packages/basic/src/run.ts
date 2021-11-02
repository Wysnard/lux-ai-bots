import { Agent, GameState, Cell } from "lux";
import { cityTileToUnitRecord, unitToCityTileRecord } from "./store";
import { ResourceType } from "./typings";
import { computePosId, getCellAtPosId, getClosestPos } from "./utils";

const agent = new Agent();

agent.run((gameState: GameState): string[] => {
  const player = gameState.players[gameState.id];
  const opponent = gameState.players[(gameState.id + 1) % 2];
  const gameMap = gameState.map;
  const researchedResourceTypes: ResourceType[] = [
    player.researchedCoal() && "coal",
    player.researchedUranium() && "uranium",
    "wood",
  ].filter((e) => !!e) as ResourceType[];
  const researchedResourceTiles: Cell[] = gameMap.map
    .flat()
    .filter(
      (tile) =>
        tile.hasResource() &&
        researchedResourceTypes.indexOf(tile.resource.type as ResourceType) >= 0
    );

  const playerWorkers = player.units.filter((unit) => unit.isWorker());
  const playerCities = Array.from(player.cities.values());
  const playerCitytiles = playerCities.map((city) => city.citytiles).flat();

  if (playerCitytiles.length === 1 && playerWorkers.length === 1) {
    const [firstWorker] = playerWorkers;
    const [firstCityTile] = playerCitytiles;
    const firstCityTilePosId = computePosId(firstCityTile.pos);

    cityTileToUnitRecord[firstCityTilePosId] = firstWorker.id;
    unitToCityTileRecord[firstWorker.id] = firstCityTilePosId;
  }

  playerWorkers.flatMap((worker) => {
    const workerCell = gameMap.map[worker.pos.x][worker.pos.y];
    const workerCityTilePosId = unitToCityTileRecord[worker.id];
    const workerCityTileCell = getCellAtPosId({
      posId: workerCityTilePosId,
      mapCells: gameMap.map,
    });

    if (worker.cargo.wood + worker.cargo.coal + worker.cargo.uranium > 0) {
      if (workerCityTileCell.citytile) {
        const cityTile = workerCityTileCell.citytile;
        const city = player.cities.get(cityTile.cityid);
        if (city && city.fuel < 50) {
          // TODO worker go give fuel to city
        }
      }
    }

    const { possibility: closestResourceTilePosition } = getClosestPos({
      origin: worker.pos,
      possibilities: researchedResourceTiles.map((tile) => tile.pos),
    });
    const dir = worker.pos.directionTo(closestResourceTilePosition);

    return [worker.move(dir)];
  });

  return [];
});
