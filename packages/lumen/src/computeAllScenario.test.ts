import * as DimensionAI from "dimensions-ai";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { computeAllScenario } from "./computeAllScenario";
import { createSimpleSDKState } from "./utils/tests/createSimpleSDKState";
import { createIntermediateSDKState } from "./utils/tests/createIntermediateSDKState";

describe("computeAllScenario", () => {
  const mapper = (actions: string[]) => actions;
  describe("simple state", () => {
    const sdkState = createSimpleSDKState();
    it("should return no actions possible", () => {
      const result = computeAllScenario(sdkState, mapper);
      expect(result).toEqual([]);
    });
  });
});
