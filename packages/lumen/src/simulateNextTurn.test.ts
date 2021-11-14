import * as DimensionAI from "dimensions-ai";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { simulateNextTurn } from "./simulateNextTurn";
import { createSimpleSDKState } from "./utils/tests/createSimpleSDKState";
import { createIntermediateSDKState } from "./utils/tests/createIntermediateSDKState";

describe("simulateNextTurn", () => {
  describe("simple state", () => {
    const sdkState = createSimpleSDKState();
    describe("without actions", () => {
      const actions = [];

      it("should increase turn count", async () => {
        const [, nextSdkState] = await simulateNextTurn({
          currentGameState: sdkState,
          actions,
        });
        expect(nextSdkState.turn).toBe(sdkState.turn + 1);
      });

      it("should increase turn count twice", async () => {
        const [, nextSdkState] = await simulateNextTurn({
          currentGameState: sdkState,
          actions,
        });
        const [, nextNextSdkState] = await simulateNextTurn({
          currentGameState: nextSdkState,
          actions,
        });
        expect(nextNextSdkState.turn).toBe(sdkState.turn + 2);
      });
    });
  });

  describe("intermediate state", () => {
    const sdkState = createIntermediateSDKState();
    describe("with move east action", () => {
      const player0Commands: DimensionAI.MatchEngine.Command[] = [
        sdkState.players[0].units[0].move(
          LuxSDK.GAME_CONSTANTS.DIRECTIONS.EAST
        ),
      ].map((action) => ({
        agentID: 0,
        command: action,
      }));
      const player1Commands = [].map((action) => ({
        agentID: 1,
        command: action,
      }));
      const actions = [...player0Commands, ...player1Commands];

      it("should have moved the worker to the east", async () => {
        const [, nextSdkState] = await simulateNextTurn({
          currentGameState: sdkState,
          actions,
        });
        expect(nextSdkState.players[0].units[0].pos.x).toBe(
          sdkState.players[0].units[0].pos.x + 1
        );
      });
    });

    describe("with build city action", () => {
      const player0Commands: DimensionAI.MatchEngine.Command[] = [
        sdkState.players[0].units[0].buildCity(),
      ].map((action) => ({
        agentID: 0,
        command: action,
      }));
      const player1Commands = [].map((action) => ({
        agentID: 1,
        command: action,
      }));
      const actions = [...player0Commands, ...player1Commands];

      it("should have built a cityTile", async () => {
        const [, nextSdkState] = await simulateNextTurn({
          currentGameState: sdkState,
          actions,
        });
        expect(nextSdkState.players[0].cityTileCount).toBe(
          sdkState.players[0].cityTileCount + 1
        );
        expect(
          nextSdkState.map.getCellByPos(nextSdkState.players[0].units[0].pos)
            .citytile
        ).not.toBeNull();
      });
    });
  });
});
