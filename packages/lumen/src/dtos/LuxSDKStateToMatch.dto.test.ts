import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

import { luxSDKStateToMatchDto } from "./LuxSDKStateToMatch.dto";

describe("simulateNextTurn", () => {
  describe("simple states", () => {
    const player0 = new LuxSDK.Player(0);
    player0.researchPoints = 10;
    const player1 = new LuxSDK.Player(1);
    player1.researchPoints = 10;
    const sdkState: LuxSDK.GameState = {
      id: 2,
      turn: 5,
      map: new LuxSDK.GameMap(2, 2),
      players: [player0, player1],
    };
    it("should return same turn as input state", async () => {
      const testMatch = await luxSDKStateToMatchDto(sdkState);

      expect(testMatch.state.game.state.turn).toBe(sdkState.turn);
    });

    it("should return same research as input state", async () => {
      const testMatch = await luxSDKStateToMatchDto(sdkState);

      expect(
        testMatch.state.game.state.teamStates[player0.team].researchPoints
      ).toBe(player0.researchPoints);
      expect(
        testMatch.state.game.state.teamStates[player1.team].researchPoints
      ).toBe(player1.researchPoints);
    });
  });
});
