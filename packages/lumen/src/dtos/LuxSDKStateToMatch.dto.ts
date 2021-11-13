import * as DimensionAI from "dimensions-ai";
import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { luxSDKStateToSerializedStateDTO } from "./luxSDKStateToSerializedState.dto";

const options = {
  storeErrorLogs: false,
  storeReplay: false,
  compressReplay: false,
  seed: undefined,
  debug: false,
  debugAnnotations: true,
  loggingLevel: DimensionAI.Logger.LEVEL.NONE,
  mapType: "random",
  detached: true,
  agentOptions: { detached: true },
  engineOptions: {
    noStdErr: false,
    timeout: {
      active: true,
      max: 3000,
    },
  },
};

const design = new LuxEngine.LuxDesign("Lux Design");
const luxdim = DimensionAI.create(design, {
  name: "luxdimension",
  id: "luxdim",
  defaultMatchConfigs: {},
  loggingLevel: DimensionAI.Logger.LEVEL.NONE,
  secureMode: false,
  observe: false,
  activateStation: false,
});

export const luxSDKStateToMatchDto = async (
  sdkState: LuxSDK.GameState
): Promise<DimensionAI.Match> => {
  const match = await luxdim.createMatch(["temp", "temp"], options);
  const serializedState = luxSDKStateToSerializedStateDTO(sdkState);
  LuxEngine.LuxDesignLogic.reset(match, serializedState);
  return match;
};
