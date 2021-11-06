import R from "ramda";
import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { Match, MatchEngine } from "dimensions-ai";

interface createLuxEngineProps {
  state: LuxSDK.GameState;
}

export interface LuxSimulator {
  game: LuxEngine.Game;
}

const createLuxEngine = async ({
  state,
}: createLuxEngineProps): Promise<LuxSimulator> => {
  const pseudomatch: any = {
    state: {},
    configs: {
      width: state.map.width,
      height: state.map.height,
      storeReplay: false,
      storeReplayDirectory: "/",
      runProfiler: false,
      debug: false,
      seed: undefined,
      mapType: LuxEngine.GameMap.Types.EMPTY,
    },
    throw: async (id: number, err: any) => {},
    sendAll: async (message: string) => {},
    send: () => {},
    log: {
      detail: () => {},
      warn: (m: string) => {},
    },
    agents: [],
  };

  await LuxEngine.LuxDesignLogic.initialize(pseudomatch);

  const game: LuxEngine.Game = (pseudomatch as Match).state.game;

  return {
    game,
  };
};

export default R.curry(createLuxEngine);
