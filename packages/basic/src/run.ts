import _ from "lodash";
import { Agent, GameState, Cell, annotate } from "@lux-ai-bots/lux-sdk";
import {
  cityTileToUnitRecord,
  purgeStore,
  unitToCityTileRecord,
} from "./store";
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
    log(`================= TURN : ${gameState.turn} ================`);
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
      unitIds: playerWorkers.map((worker) => worker.id),
      cityTilePosIds: playerCityTiles.map((cityTile) =>
        computePosId(cityTile.pos)
      ),
    });

    // log(JSON.stringify(playerCityTiles.map(e => e.pos)));

    const canWeBuildWorkers = playerCities.length > playerWorkers.length;

    const playerWorkerCitiesPair = _.zip(playerWorkers, playerCityTiles);

    const actions = playerWorkerCitiesPair.flatMap(([worker, cityTile]) => {
      const pairActions = [];

      log(`${worker?.id} | ${cityTile?.cityid}`);

      // If only worker exists
      if (!cityTile && worker) {
        if (unitHasEnoughResourceToBuildCity(worker)) {
          if (worker.canBuild(gameMap)) {
            pairActions.push(worker.buildCity());
            pairActions.push(
              annotate.sidetext(`[WORKER] ${worker.id} : BUILD CITY`)
            );
          } else {
            const { possibility: closestEmptyCellPosition } = getClosestPos({
              origin: worker.pos,
              possibilities: emptyCells.map((cell) => cell.pos),
            });
            const dir = worker.pos.directionTo(closestEmptyCellPosition);
            pairActions.push(worker.move(dir));
            pairActions.push(
              annotate.sidetext(
                `[WORKER] ${worker.id} is going to build a city in empty tile : move to ${dir}`
              )
            );
          }
        } else {
          const { possibility: closestResourceTilePosition } = getClosestPos({
            origin: worker.pos,
            possibilities: researchedResourceCells.map((cell) => cell.pos),
          });
          const dir = worker.pos.directionTo(closestResourceTilePosition);
          pairActions.push(worker.move(dir));
          pairActions.push(
            annotate.sidetext(
              `[WORKER] ${worker.id} is going to collect ressources : move to ${dir}`
            )
          );
        }
      }
      //

      // If city exists
      if (cityTile) {
        if (cityTile.canAct()) {
          pairActions.push(cityTile.buildWorker());
        }
      }
      //

      // Pair exists
      if (worker && cityTile) {
        if (unitHasEnoughResourceToBuildCity(worker)) {
          if (worker.canBuild(gameMap)) {
            pairActions.push(worker.buildCity());
            pairActions.push(
              annotate.sidetext(`[WORKER] ${worker.id} : BUILD CITY`)
            );
          } else {
            const { possibility: closestEmptyCellPosition } = getClosestPos({
              origin: worker.pos,
              possibilities: emptyCells.map((cell) => cell.pos),
            });
            const dir = worker.pos.directionTo(closestEmptyCellPosition);
            pairActions.push(worker.move(dir));
            pairActions.push(
              annotate.sidetext(
                `[WORKER] ${worker.id} is going to build a city in empty tile : move to ${dir}`
              )
            );
          }
        } else if (cargoTotalLoad(worker.cargo) > 0) {
          const city = player.cities.get(cityTile.cityid);
          if (worker.getCargoSpaceLeft() === 0 || (city && city.fuel < 200)) {
            const dir = worker.pos.directionTo(cityTile.pos);
            pairActions.push(worker.move(dir));
            pairActions.push(
              annotate.sidetext(
                `[WORKER] ${worker.id} is going to fuel his city : move to ${dir}`
              )
            );
          }
        } else {
          const { possibility: closestResourceTilePosition } = getClosestPos({
            origin: worker.pos,
            possibilities: researchedResourceCells.map((cell) => cell.pos),
          });
          const dir = worker.pos.directionTo(closestResourceTilePosition);
          pairActions.push(worker.move(dir));
          pairActions.push(
            annotate.sidetext(
              `[WORKER] ${worker.id} is going to collect ressources : move to ${dir}`
            )
          );
        }
      }
      //
      return pairActions;
    });

    log(`${actions.join(" -> ")}}`);

    return actions;
  });
};
