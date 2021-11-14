import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

import { luxSDKStateToSerializedStateDTO } from "./luxSDKStateToSerializedState.dto";
import { createSimpleSDKState } from "../utils/tests/createSimpleSDKState";
import { createIntermediateSDKState } from "../utils/tests/createIntermediateSDKState";

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
    const sdkState = createIntermediateSDKState();
    const serialized = luxSDKStateToSerializedStateDTO(sdkState);

    it("should display the same turn", () => {
      expect(serialized.turn).toBe(sdkState.turn);
    });

    it("should display 10 research points for player 0", () => {
      expect(serialized.teamStates[0].researchPoints).toBe(
        sdkState.players[0].researchPoints
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
      expect(Object.values(serialized.cities).length).toBe(1);
      const cityCell = Object.values(serialized.cities)[0].cityCells[0];
      expect([cityCell.x, cityCell.y]).toEqual([2, 2]);
    });

    it("should 1 as globalUnitIDCount", () => {
      expect(serialized.globalUnitIDCount).toBe(1);
    });

    it("should have 1 unit", () => {
      expect(Object.values(serialized.teamStates["0"].units).length).toBe(1);

      const serializedUnit = Object.values(serialized.teamStates["0"].units)[0];
      expect(serializedUnit.x).toBe(sdkState.players[0].units[0].pos.x);
      expect(serializedUnit.y).toBe(sdkState.players[0].units[0].pos.y);
      expect(serializedUnit.cooldown).toBe(
        sdkState.players[0].units[0].cooldown
      );
      expect(serializedUnit.type).toBe(sdkState.players[0].units[0].type);
    });
  });
});
