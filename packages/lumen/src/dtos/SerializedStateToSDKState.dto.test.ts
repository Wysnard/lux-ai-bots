import fs from "fs";
import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

import { luxSDKStateToSerializedStateDTO } from "./luxSDKStateToSerializedState.dto";
import { serializedStateToSDKStateDTO } from "./SerializedStateToSDKState.dto";

describe("serializedStateToSDKStateDTO", () => {
  describe("simple state", () => {
    const player0 = new LuxSDK.Player(0);
    const player1 = new LuxSDK.Player(1);
    const sdkState: LuxSDK.GameState = {
      id: 2,
      turn: 5,
      map: new LuxSDK.GameMap(10, 10),
      players: [player0, player1],
    };
    const serialized = luxSDKStateToSerializedStateDTO(sdkState);
    const backToState = serializedStateToSDKStateDTO(serialized);

    it("should display the same turn", () => {
      expect(backToState.turn).toBe(serialized.turn);
      expect(backToState.turn).toBe(sdkState.turn);
    });

    it("should be same as unserialized state", () => {
      expect(backToState).toEqual({ ...sdkState, id: expect.anything() });
    });
  });

  describe("intermediate state", () => {
    const gameMap = new LuxSDK.GameMap(10, 10);
    const player0 = new LuxSDK.Player(0);
    player0.researchPoints = 10;
    const city_id = "c_1";
    player0.cities.set(city_id, new LuxSDK.City(0, city_id, 120, 100));
    const city = player0.cities.get(city_id);
    const cityTile = city.addCityTile(2, 2, 4);
    gameMap.getCell(2, 2).citytile = cityTile;
    player0.cityTileCount += 1;
    const player1 = new LuxSDK.Player(1);
    gameMap._setResource(LuxSDK.GAME_CONSTANTS.RESOURCE_TYPES.WOOD, 5, 5, 100);
    const sdkState: LuxSDK.GameState = {
      id: 2,
      turn: 5,
      map: gameMap,
      players: [player0, player1],
    };
    const serialized = luxSDKStateToSerializedStateDTO(sdkState);
    const backToState = serializedStateToSDKStateDTO(serialized);

    it("should be same as unserialized state", () => {
      console.log("serialized cities :", serialized.cities);
      console.log(
        "backToState.players[0].cities :",
        backToState.players[0].cities
      );
      expect(backToState).toEqual({ ...sdkState, id: expect.anything() });
    });
  });
});
