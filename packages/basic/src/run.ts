import _ from "lodash";
import {
  Agent,
  GameState,
  Cell,
  annotate,
  Position,
  Unit,
} from "@lux-ai-bots/lux-sdk";
import { PosId, ResourceType } from "./typings";
import {
  cargoTotalLoad,
  cellIsEmpty,
  getClosestPos,
  logTo,
  unitHasEnoughResourceToBuildCity,
} from "./utils";

const log = logTo("../log.txt");
import { computeUnitNextPosition } from "./utils";
const agent = new Agent();

export const run = () => {
  agent.run((gameState: GameState): string[] => {
    if (gameState.turn === 30) {
      log(`================= TURN : ${gameState.turn} ================`);
      log(JSON.stringify(gameState));
    }
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
    const emptyCells: Cell[] = gameMap.map.flat().filter(cellIsEmpty);

    const canWeBuildWorkers = playerCityTiles.length > playerWorkers.length;

    const playerWorkerCitiesPair = _.zip(playerWorkers, playerCityTiles);

    const takenPositions: Record<PosId, Unit> = playerWorkers.reduce(
      (acc, worker) => ({
        ...acc,
        [`${worker.pos.x}_${worker.pos.y}`]: worker,
      }),
      {}
    );

    const actions = playerWorkerCitiesPair.flatMap(([worker, cityTile]) => {
      const pairActions = [];

      // log(`${worker?.id} | ${cityTile?.cityid}`);

      // If only worker exists
      if (!cityTile && worker) {
        if (unitHasEnoughResourceToBuildCity(worker) && worker.canAct()) {
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
            const nextUnitPosition = computeUnitNextPosition(worker, dir);
            if (
              !takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] &&
              worker.canAct()
            ) {
              delete takenPositions[`${worker.pos.x}_${worker.pos.y}`];
              takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] =
                worker;
              pairActions.push(worker.move(dir));
              pairActions.push(
                annotate.sidetext(
                  `[WORKER] ${worker.id} is going to build a city in empty tile : move to ${dir}`
                )
              );
            }
          }
        } else {
          const { possibility: closestResourceTilePosition } = getClosestPos({
            origin: worker.pos,
            possibilities: researchedResourceCells.map((cell) => cell.pos),
          });
          const dir = worker.pos.directionTo(closestResourceTilePosition);
          const nextUnitPosition = computeUnitNextPosition(worker, dir);

          if (
            !takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] &&
            worker.canAct()
          ) {
            delete takenPositions[`${worker.pos.x}_${worker.pos.y}`];
            takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] =
              worker;
            pairActions.push(worker.move(dir));
            pairActions.push(
              annotate.sidetext(
                `[WORKER] ${worker.id} is going to collect ressources : move to ${dir}`
              )
            );
          }
        }
      }
      //

      // If city exists
      if (cityTile) {
        if (cityTile.canAct() && canWeBuildWorkers) {
          pairActions.push(cityTile.buildWorker());
        }
      }
      //

      // Pair exists
      if (worker && cityTile) {
        const city = player.cities.get(cityTile.cityid);
        if (
          unitHasEnoughResourceToBuildCity(worker) &&
          worker.canAct() &&
          playerCityTiles.length - playerWorkers.length <= 1 &&
          Math.random() > 0.8
        ) {
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
            const nextUnitPosition = computeUnitNextPosition(worker, dir);
            if (
              !takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] &&
              worker.canAct()
            ) {
              delete takenPositions[`${worker.pos.x}_${worker.pos.y}`];
              takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] =
                worker;
              pairActions.push(worker.move(dir));
              pairActions.push(
                annotate.sidetext(
                  `[WORKER] ${worker.id} is going to build a city in empty tile : move to ${dir}`
                )
              );
            }
          }
        } else if (
          cargoTotalLoad(worker.cargo) > 0 &&
          (worker.getCargoSpaceLeft() === 0 || (city && city.fuel < 300))
        ) {
          const dir = worker.pos.directionTo(cityTile.pos);
          const nextUnitPosition = computeUnitNextPosition(worker, dir);
          if (
            !takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] &&
            worker.canAct()
          ) {
            delete takenPositions[`${worker.pos.x}_${worker.pos.y}`];
            takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] =
              worker;
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
          const nextUnitPosition = computeUnitNextPosition(worker, dir);
          if (
            !takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] &&
            worker.canAct()
          ) {
            delete takenPositions[`${worker.pos.x}_${worker.pos.y}`];
            takenPositions[`${nextUnitPosition.x}_${nextUnitPosition.y}`] =
              worker;
            pairActions.push(worker.move(dir));
            pairActions.push(
              annotate.sidetext(
                `[WORKER] ${worker.id} is going to collect ressources : move to ${dir}`
              )
            );
          }
        }
      }
      //
      return pairActions;
    });

    // log(`${actions.join(" -> ")}}`);

    return actions;
  });
};
