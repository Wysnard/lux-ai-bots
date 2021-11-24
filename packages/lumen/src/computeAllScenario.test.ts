import * as DimensionAI from "dimensions-ai";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { computeAllScenario } from "./computeAllScenario";
import { createSimpleSDKState } from "./utils/tests/createSimpleSDKState";
import { createIntermediateSDKState } from "./utils/tests/createIntermediateSDKState";
import { Unit } from "@lux-ai-bots/lux-sdk";
import { createComplexSDKState } from "./utils/tests/createComplexSDKState";

describe("computeAllScenario", () => {
  const mapper = (actions: string[]) => actions;
  describe("simple state", () => {
    const sdkState = createSimpleSDKState();
    it.skip("should return no actions possible", () => {
      const result = computeAllScenario(sdkState, mapper);
      expect(result).toEqual([]);
    });


  });
  describe("intermediate state", () => {
    const sdkState = createComplexSDKState();
    it("should return some possible actions", () => {
      const result = computeAllScenario(sdkState, mapper);
      expect(result.length).toEqual(1);
    });
  });
});
