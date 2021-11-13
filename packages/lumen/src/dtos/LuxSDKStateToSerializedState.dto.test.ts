import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

import { luxSDKStateToSerializedStateDTO } from "./luxSDKStateToSerializedState.dto";
import { createSimpleSDKState } from "../utils/tests/createSimpleSDKState";

describe("luxSDKStateToSerializedState", () => {
  describe("simple state", () => {
    const sdkState = createSimpleSDKState();
    const serialized = luxSDKStateToSerializedStateDTO(sdkState);

    it("should display the same turn", () => {
      expect(serialized.turn).toBe(sdkState.turn);
    });

    it("should display 0 globalId", () => {
      expect(serialized.globalCityIDCount).toBe(0);
      expect(serialized.globalUnitIDCount).toBe(0);
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
    const unit_id = "u_1";
    player0.units.push(
      new LuxSDK.Unit(
        0,
        LuxSDK.GAME_CONSTANTS.UNIT_TYPES.WORKER,
        unit_id,
        4,
        4,
        2,
        20,
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
    const serialized = luxSDKStateToSerializedStateDTO(sdkState);

    it("should display the same turn", () => {
      expect(serialized.turn).toBe(sdkState.turn);
    });

    it("should display 10 research points for player 0", () => {
      expect(serialized.teamStates[0].researchPoints).toBe(
        player0.researchPoints
      );
    });

    it("should have woods at 5 x 5", () => {
      expect(serialized.map[5][5].resource.amount).toBe(100);
      expect(serialized.map[5][5].resource.type).toBe("wood");
    });

    it("should 1 as globalCityCountId", () => {
      expect(serialized.globalCityIDCount).toBe(1);
    });

    it("should have 1 city at 2 x 2", () => {
      const cityCell = serialized.cities[city_id].cityCells[0];
      expect([cityCell.x, cityCell.y]).toEqual([2, 2]);
    });

    it("should have 1 unit", () => {
      const serializedUnit = serialized.teamStates["0"].units[unit_id];
      expect(serializedUnit.x).toBe(player0.units[0].pos.x);
      expect(serializedUnit.y).toBe(player0.units[0].pos.y);
      expect(serializedUnit.cooldown).toBe(player0.units[0].cooldown);
      expect(serializedUnit.type).toBe(player0.units[0].type);
    });
  });
});
