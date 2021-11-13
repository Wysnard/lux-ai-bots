import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

export const createSimpleSDKState = (): LuxSDK.GameState => {
  const player0 = new LuxSDK.Player(0);
  const player1 = new LuxSDK.Player(1);
  const sdkState: LuxSDK.GameState = {
    id: 2,
    turn: 5,
    map: new LuxSDK.GameMap(2, 2),
    players: [player0, player1],
  };
  return sdkState;
};
