import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

import { luxSDKStateToSerializedStateDTO } from "./luxSDKStateToSerializedState.dto";
import { serializedStateToSDKStateDTO } from "./SerializedStateToSDKState.dto";
import { createSimpleSDKState } from "../utils/tests/createSimpleSDKState";
import { createIntermediateSDKState } from "../utils/tests/createIntermediateSDKState";
import { createComplexSDKState } from "../utils/tests/createComplexSDKState";

describe("serializedStateToSDKStateDTO", () => {
  describe("simple state", () => {
    const sdkState = createSimpleSDKState();
    const serialized = luxSDKStateToSerializedStateDTO(sdkState);
    const backToState = serializedStateToSDKStateDTO(serialized);

    it("should display the same turn", () => {
      expect(backToState.turn).toBe(serialized.turn);
      expect(backToState.turn).toBe(sdkState.turn);
    });

    it("should be same as unserialized state", () => {
      expect(backToState).toEqual({ ...sdkState, id: expect.anything() });
    });
  });

  describe("intermediate state", () => {
    const sdkState = createIntermediateSDKState();
    const serialized = luxSDKStateToSerializedStateDTO(sdkState);
    const backToState = serializedStateToSDKStateDTO(serialized);

    it("should be same as unserialized state", () => {
      expect(backToState).toEqual({ ...sdkState, id: expect.anything() });
    });
  });

  describe("complex state", () => {
    const sdkState = createComplexSDKState();
    const serialized = luxSDKStateToSerializedStateDTO(sdkState);
    const backToState = serializedStateToSDKStateDTO(serialized);

    it("should be same as unserialized state", () => {
      expect(backToState).toEqual({ ...sdkState, id: expect.anything() });
    });
  });
});
