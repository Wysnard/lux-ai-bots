import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { Match } from "dimensions-ai";

const makePseudoMatch = (state: LuxSDK.GameState): Partial<Match> => {
  // this.pseudomatch.configs.seed = replayData.seed;
  // this.pseudomatch.configs.mapType = replayData.mapType;
  // this.pseudomatch.configs.width = replayData.width;
  // this.pseudomatch.configs.height = replayData.height;
  return {
    state,
    configs: {
      storeReplay: false,
      storeReplayDirectory: "/",
      runProfiler: false,
      debug: false,
      seed: undefined,
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

export const simulateNextTurn = ({
  currentGameState,
  actions,
}: SimulateNextTurnProps): Promise<LuxSDK.GameState> => {
  const pseudomatch = makePseudoMatch(currentGameState);
  return LuxEngine.LuxDesignLogic.update(pseudomatch as Match, actions).then(
    () => pseudomatch.state
  );
};
