import R from "ramda";
import { Match } from 'dimensions-ai';
import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

// class MyDesign extends Design {
//   static initialize(match)
//   static update(match: Match, commands: Array<MatchEngine.Command>)
// }

// match.state

// LuxEngine.LuxDesignLogic.update(match: Match, commands: Array<MatchEngine.Command>)

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

interface SimulateNextTurnProps {
  currentGameState: LuxSDK.GameState;
  commands: string[]
}

const simulateNextTurn = ({
  currentGameState, commands
}: SimulateNextTurnProps): LuxSDK.GameState => {
  // const engineMap = new LuxEngine.GameMap(config)
  // const ourMap = new LuxSDK.GameMap(width, height)
  // currentStatte => match
  pseudomatch.state.map = currentGameState.map
  // LuxEngine.LuxDesignLogic.update(pseudomatch, commands: Array<MatchEngine.Command>)
};
