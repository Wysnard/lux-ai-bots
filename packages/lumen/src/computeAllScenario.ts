import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";


/**
 *
 * @param gameState
 * @param mapper
 * @returns {string[]}
 *
 * @todo Compute all possible Game State.
 * @body Take a game state and return all possible Game State from a root game state. It takes the original game state and a mapper to compute in a optimize way the possibilities.
 */
export function computeAllScenario<T>(
  gameState: LuxSDK.GameState,
  mapper: (actions: string[]) => T
): T[] {
  const [player0UnitActions, player1UnitActions] = gameState.players.map(
    (player, i) =>
      player.units
        .filter((unit) => unit.canAct())
        .map((unit) =>
          [
            // TODO: add conditions to directions wtih concat
            unit.move(LuxSDK.GAME_CONSTANTS.DIRECTIONS.NORTH),
            unit.move(LuxSDK.GAME_CONSTANTS.DIRECTIONS.WEST),
            unit.move(LuxSDK.GAME_CONSTANTS.DIRECTIONS.SOUTH),
            unit.move(LuxSDK.GAME_CONSTANTS.DIRECTIONS.EAST),
            unit.move(LuxSDK.GAME_CONSTANTS.DIRECTIONS.CENTER),
          ]
            .concat(unit.canBuild(gameState.map) ? unit.buildCity() : [])
            .concat(unit.isWorker() ? unit.pillage() : [])
        )
  );

  const [player0CityTileActions, player1CityTileActions] =
    gameState.players.map((player, i) =>
      Array.from(player.cities.values()).flatMap((city) =>
        city.citytiles
          .filter((cityTile) => cityTile.canAct())
          .map((cityTile) => [
            cityTile.research(),
            //  TODO: add conditions to build  with concat
            cityTile.buildWorker(),
            cityTile.buildCart(),
          ])
      )
    );

    const allScenarios = [
      ...[...player0UnitActions, ...player0CityTileActions],
      ...[...player1UnitActions, ...player1CityTileActions],
    ].reduce((scenarios, playerActions) =>
      scenarios.reduce((scenari, actions) =>
        scenari.concat(playerActions.map(action => [].concat(actions, action))), []));
  
    return [mapper(allScenarios)];
}
