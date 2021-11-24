import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

export const createComplexSDKState = (): LuxSDK.GameState => {
  const gameMap = new LuxSDK.GameMap(10, 10);
  const player0 = new LuxSDK.Player(0);
  player0.researchPoints = 10;
  const city_id_1 = "c_1";
  player0.cities.set(city_id_1, new LuxSDK.City(0, city_id_1, 120, 100));
  const city_1 = player0.cities.get(city_id_1);
  const cityTile_1 = city_1.addCityTile(2, 2, 4);
  gameMap.getCell(cityTile_1.pos.x, cityTile_1.pos.y).citytile = cityTile_1;
  player0.cityTileCount += 1;
  const unit_id_1 = "u_1";
  player0.units.push(
    new LuxSDK.Unit(
      0,
      LuxSDK.GAME_CONSTANTS.UNIT_TYPES.WORKER,
      unit_id_1,
      4,
      4,
      0,
      100,
      0,
      0
    )
  );
  const unit_id_5 = "u_5";
  player0.units.push(
    new LuxSDK.Unit(
      1,
      LuxSDK.GAME_CONSTANTS.UNIT_TYPES.WORKER,
      unit_id_5,
      1,
      1,
      0,
      0,
      0,
      0
    )
  );
  const player1 = new LuxSDK.Player(1);
  const city_id_2 = "c_2";
  player1.cities.set(city_id_2, new LuxSDK.City(1, city_id_2, 120, 100));
  const city_2 = player1.cities.get(city_id_2);
  const cityTile_2 = city_2.addCityTile(5, 6, 0);
  gameMap.getCell(cityTile_2.pos.x, cityTile_2.pos.y).citytile = cityTile_2;
  player1.cityTileCount += 1;
  const unit_id_2 = "u_2";
  player1.units.push(
    new LuxSDK.Unit(
      1,
      LuxSDK.GAME_CONSTANTS.UNIT_TYPES.WORKER,
      unit_id_2,
      5,
      6,
      0,
      0,
      0,
      0
    )
  );
  const unit_id_3 = "u_3";
  player1.units.push(
    new LuxSDK.Unit(
      1,
      LuxSDK.GAME_CONSTANTS.UNIT_TYPES.WORKER,
      unit_id_3,
      6,
      6,
      0,
      0,
      0,
      0
    )
  );

  gameMap._setResource(LuxSDK.GAME_CONSTANTS.RESOURCE_TYPES.WOOD, 5, 5, 100);
  const sdkState: LuxSDK.GameState = {
    id: 2,
    turn: 5,
    map: gameMap,
    players: [player0, player1],
  };
  return sdkState;
};
