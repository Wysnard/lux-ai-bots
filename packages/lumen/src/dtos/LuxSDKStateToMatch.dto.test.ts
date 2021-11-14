import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

import { luxSDKStateToMatchDto } from "./LuxSDKStateToMatch.dto";
import { createSimpleSDKState } from "../utils/tests/createSimpleSDKState";
import { createIntermediateSDKState } from "../utils/tests/createIntermediateSDKState";

describe("simulateNextTurn", () => {
  describe("simple states", () => {
    const sdkState = createSimpleSDKState();
    it("should return same turn as input state", async () => {
      const testMatch = await luxSDKStateToMatchDto(sdkState);

      expect(testMatch.state.game.state.turn).toBe(sdkState.turn);
    });
  });

  describe("intermediate states", () => {
    const sdkState = createIntermediateSDKState();
    it("should return same turn as input state", async () => {
      const testMatch = await luxSDKStateToMatchDto(sdkState);

      expect(testMatch.state.game.state.turn).toBe(sdkState.turn);
    });
  });
});
