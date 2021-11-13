import { simulateNextTurn } from "./simulateNextTurn";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

describe("simulateNextTurn", () => {
  describe("simple state", () => {
    const player0 = new LuxSDK.Player(0);
    const player1 = new LuxSDK.Player(1);
    const sdkState: LuxSDK.GameState = {
      id: 2,
      turn: 5,
      map: new LuxSDK.GameMap(10, 10),
      players: [player0, player1],
    };
    describe("without actions", () => {
      const actions = [];

      it("should increase turn count", async () => {
        const nextSdkState = await simulateNextTurn({
          currentGameState: sdkState,
          actions,
        });
        expect(nextSdkState.turn).toBe(sdkState.turn + 1);
      });
    });
  });
});
