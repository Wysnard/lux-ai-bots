import * as LuxEngine from "@lux-ai-bots/engine";
import { GameMap, LuxMatchState } from "@lux-ai-bots/engine";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { GAME_CONSTANTS } from "@lux-ai-bots/lux-sdk";
import R from "ramda";
import { Match } from "dimensions-ai";
import seedrandom from "seedrandom";

const makePseudoMatch = (state: LuxSDK.GameState): Partial<Match> => {
  // pseudomatch.configs.seed = replayData.seed;
  // pseudomatch.configs.mapType = replayData.mapType;
  // pseudomatch.configs.width = replayData.width;
  // pseudomatch.configs.height = replayData.height;
  return {
    state,
    configs: {
      storeReplay: false,
      storeReplayDirectory: "/",
      runProfiler: false,
      debug: false,
      seed: 21489218,
      mapType: LuxEngine.GameMap.Types.EMPTY,
      name: {} as any,
      loggingLevel: {} as any,
      engineOptions: {} as any,
      secureMode: {} as any,
      agentOptions: {} as any,
      languageSpecificAgentOptions: {} as any,
      agentSpecificOptions: {} as any,
      storeErrorLogs: {} as any,
      storeMatchErrorLogs: {} as any,
      storeErrorDirectory: {} as any,
      detached: {} as any,
      width: 2,
      height: 2,
    },
    throw: (id: number, err: any) => Promise.resolve(undefined),
    sendAll: (message: string) => Promise.resolve(true),
    send: () => Promise.resolve(true),
    log: {
      detail: () => {},
      warn: (m: string) => {},
      level: {} as any,
      identifier: {} as any,
      identifierColor: {} as any,
      getIdentifier: {} as any,
      bar: {} as any,
      importantBar: {} as any,
      important: {} as any,
      systemIObar: {} as any,
      systemIO: {} as any,
      systembar: {} as any,
      system: {} as any,
      detailbar: {} as any,
      infobar: {} as any,
      info: {} as any,
      warnbar: {} as any,
      errorbar: {} as any,
      error: {} as any,
      custom: {} as any,
    },
    agents: [],
    design: {} as any,
    agentFiles: {} as any,
    creationDate: {} as any,
    finishDate: {} as any,
    name: {} as any,
    id: {} as any,
    idToAgentsMap: {} as any,
  };
};

interface SimulateNextTurnProps {
  currentGameState: LuxSDK.GameState;
  actions: {
    command: string;
    agentID: number;
  }[];
}

// export const dimensionsAiToLuxSDKDTO = (
//   matchState: LuxMatchState
// ): LuxSDK.GameState => {
//   return {
//     map: (matchState.game.map as any).map,
//     id: 1,
//     players:
//   };
// };

export const simulateNextTurn = ({
  currentGameState,
  actions,
}: SimulateNextTurnProps): Promise<LuxSDK.GameState> => {
  const pseudomatch = makePseudoMatch(currentGameState);
  console.log("state 1", JSON.stringify(pseudomatch.state, null, " "));
  LuxEngine.LuxDesignLogic.initialize(pseudomatch as Match);
  pseudomatch.state.game.state.turn = 3;
  // console.log("state 2", JSON.stringify(pseudomatch.state, null, " "));
  return LuxEngine.LuxDesignLogic.update(pseudomatch as Match, actions).then(
    () => pseudomatch.state
  );
};
