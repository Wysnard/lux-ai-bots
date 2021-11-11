import { simulateNextTurn } from "./simulateNextTurn";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

describe("simulateNextTurn", () => {
  const gameMap = new LuxSDK.GameMap(2, 2);
  const player0 = new LuxSDK.Player(0);
  const player1 = new LuxSDK.Player(1);

  const iniGameState: LuxSDK.GameState = {
    id: 1,
    turn: 3,
    map: gameMap,
    players: [player0, player1],
  };

  test("testing without any actions", () => {
    // console.log("prev state", JSON.stringify(iniGameState, null, "  "));
    simulateNextTurn({
      currentGameState: iniGameState,
      actions: [],
    })
      .then((nextState) => {
        console.log("state 2", JSON.stringify(nextState, null, "  "));
        expect(nextState).toBeTruthy();
      })
      .catch((err) => {
        console.error("error", err);
      });
  });
});
