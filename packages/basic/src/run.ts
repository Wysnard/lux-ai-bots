import _ from 'lodash';
import { Agent, GameState, Cell, annotate } from "@lux-ai-bots/lux-sdk";
import { cityTileToUnitRecord, purgeStore, unitToCityTileRecord } from "./store";
import { PosId, ResourceType } from "./typings";
import {
  cargoTotalLoad,
  cellIsEmpty,
  computePosId,
  getCellAtPosId,
  getClosestPos,
  logTo,
  unitHasEnoughResourceToBuildCity,
} from "./utils";

const log = logTo("../log.txt");

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

    purgeStore({
      unitIds: playerWorkers.map(worker => worker.id),
      cityTilePosIds: playerCityTiles.map(cityTile => computePosId(cityTile.pos))
    });

    log(JSON.stringify(playerCityTiles.map(e => e.pos)));

    const canWeBuildWorkers = playerCities.length > playerWorkers.length;


    const playerWorkerCitiesPair = _.zip(playerWorkers, playerCityTiles)

    return _(playerWorkerCitiesPair).flatMap(([worker, cityTile]) => {

      const actions = [];

      // If only worker exists
      if (!cityTile && worker) {
        if (unitHasEnoughResourceToBuildCity(worker)) {
          if (worker.canBuild(gameMap)) {
            return [worker.buildCity()];
          } else {
            const { possibility: closestEmptyCellPosition } = getClosestPos({
              origin: worker.pos,
              possibilities: emptyCells.map((cell) => cell.pos),
            });
            actions.push(worker.pos.directionTo(closestEmptyCellPosition))
          }
        }

        const { possibility: closestResourceTilePosition } = getClosestPos({
          origin: worker.pos,
          possibilities: researchedResourceCells.map((cell) => cell.pos),
        });
        actions.push(worker.pos.directionTo(closestResourceTilePosition))
      }
      //

      // If only city exists
      if (cityTile && !worker) {
        if (cityTile.canAct()) {
          actions.push(cityTile.buildWorker());
        }
      }
      //

      // Pair exists
      if (worker && cityTile) {
        if (cargoTotalLoad(worker.cargo) > 0) {
            const city = player.cities.get(cityTile.cityid);
            if (worker.getCargoSpaceLeft() === 0 || (city && city.fuel < 200)) {
              actions.push(worker.move(worker.pos.directionTo(cityTile.pos)));
            }
        }
        if (unitHasEnoughResourceToBuildCity(worker)) {
          if (worker.canBuild(gameMap)) {
            return [worker.buildCity()];
          } else {
            const { possibility: closestEmptyCellPosition } = getClosestPos({
              origin: worker.pos,
              possibilities: emptyCells.map((cell) => cell.pos),
            });
            actions.push(worker.pos.directionTo(closestEmptyCellPosition))
          }
        }

        const { possibility: closestResourceTilePosition } = getClosestPos({
          origin: worker.pos,
          possibilities: researchedResourceCells.map((cell) => cell.pos),
        });
        actions.push(worker.pos.directionTo(closestResourceTilePosition))
      }
      //
      return actions
    }).value()
    

    //

    if (playerCityTiles.length === 1 && playerWorkers.length === 1) {
      const [firstWorker] = playerWorkers;
      const [firstCityTile] = playerCityTiles;
      const firstCityTilePosId = computePosId(firstCityTile.pos);

      // @ts-ignore
      cityTileToUnitRecord[firstCityTilePosId] = firstWorker.id;
      unitToCityTileRecord[firstWorker.id] = firstCityTilePosId;
    }

    const nonAssociatedCityTiles = playerCityTiles.filter(cityTile => !cityTileToUnitRecord[computePosId(cityTile.pos)]);

    if (playerWorkers.length > 1) {
      playerWorkers.forEach((worker, index): void => {
        const workerCityTilePosId = unitToCityTileRecord[worker.id];
        if (!workerCityTilePosId) {
          const cityTileToAssociate = nonAssociatedCityTiles?.[index];
          if (cityTileToAssociate) {
            unitToCityTileRecord[worker.id] = computePosId(cityTileToAssociate.pos);
            cityTileToUnitRecord[unitToCityTileRecord[worker.id]] = worker.id;  
          }
        }
      });
    }

    // log(JSON.stringify({unitToCityTileRecord}));

    const cityTilesActions = canWeBuildWorkers ? playerCityTiles
      .filter((cityTile) => cityTile.canAct() && !cityTileToUnitRecord[computePosId(cityTile.pos)])
      .map((cityTile) => cityTile.buildWorker()) : [];
    
    const workersActions = playerWorkers
      .filter((worker) => worker.canAct())
      .flatMap((worker) => {
        const workerCell = gameMap.map[worker.pos.x][worker.pos.y];
        const workerCityTilePosId = unitToCityTileRecord[worker.id];
        const workerCityTileCell = workerCityTilePosId ? getCellAtPosId({
          posId: workerCityTilePosId,
          mapCells: gameMap.map,
        }) : null;

        // annotate.sidetext(`CARGO LEFT : ${worker.getCargoSpaceLeft()}`);
        // console.log(`CARGO LEFT : ${worker.getCargoSpaceLeft()}`);

        if (unitHasEnoughResourceToBuildCity(worker)) {
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

        if (cargoTotalLoad(worker.cargo) > 0 && workerCityTileCell) {
          if (workerCityTileCell.citytile) {
            const cityTile = workerCityTileCell.citytile;
            const city = player.cities.get(cityTile.cityid);
            if (worker.getCargoSpaceLeft() === 0 || (city && city.fuel < 200)) {
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

    return [...workersActions, ...cityTilesActions];
  });
};
