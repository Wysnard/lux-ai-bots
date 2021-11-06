import R from "ramda";
import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

const pseudomatch: any = {
  state: {},
  configs: {
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

interface createLuxConfigProps {}

const createLuxConfig = ({}: createLuxConfigProps) => {
  return R.mergeDeepLeft(pseudomatch);
};

interface simulateNextTurnProps {
  startGameState: LuxSDK.GameState;
}

const simulateNextTurn = ({
  startGameState,
}: simulateNextTurnProps): LuxSDK.GameState => {};
