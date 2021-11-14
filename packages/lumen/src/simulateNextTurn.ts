import * as DimensionAI from "dimensions-ai";
import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { luxSDKStateToMatchDto } from "./dtos/LuxSDKStateToMatch.dto";
import { serializedStateToSDKStateDTO } from "./dtos/SerializedStateToSDKState.dto";

interface SimulateNextTurnProps {
  currentGameState: LuxSDK.GameState;
  actions: DimensionAI.MatchEngine.Command[];
}

export const simulateNextTurn = async ({
  currentGameState,
  actions,
}: SimulateNextTurnProps): Promise<
  [DimensionAI.Match.Status, LuxSDK.GameState]
> => {
  const match = await luxSDKStateToMatchDto(currentGameState);
  const match_status = await match.step(actions);
  const serializedState = (
    match.state as LuxEngine.LuxMatchState
  ).game.toStateObject();
  return [match_status, serializedStateToSDKStateDTO(serializedState)];
};
