import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

export const createIntermediateSDKState = (): LuxSDK.GameState => {
  const gameMap = new LuxSDK.GameMap(10, 10);
  const player0 = new LuxSDK.Player(0);
  player0.researchPoints = 10;
  const city_id = "c_1";
  player0.cities.set(city_id, new LuxSDK.City(0, city_id, 120, 100));
  const city = player0.cities.get(city_id);
  const cityTile = city.addCityTile(2, 2, 4);
  gameMap.getCell(2, 2).citytile = cityTile;
  player0.cityTileCount += 1;
  const unit_id = "u_1";
  player0.units.push(
    new LuxSDK.Unit(
      0,
      LuxSDK.GAME_CONSTANTS.UNIT_TYPES.WORKER,
      unit_id,
      4,
      4,
      0,
      100,
      0,
      0
    )
  );
  const player1 = new LuxSDK.Player(1);
  gameMap._setResource(LuxSDK.GAME_CONSTANTS.RESOURCE_TYPES.WOOD, 5, 5, 100);
  const sdkState: LuxSDK.GameState = {
    id: 2,
    turn: 5,
    map: gameMap,
    players: [player0, player1],
  };
  return sdkState;
};
