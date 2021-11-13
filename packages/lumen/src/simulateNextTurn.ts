import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import R from "ramda";
import seedrandom from "seedrandom";
import { luxSDKStateToMatchDto } from "./dtos/LuxSDKStateToMatch.dto";
import { serializedStateToSDKStateDTO } from "./dtos/SerializedStateToSDKState.dto";

interface SimulateNextTurnProps {
  currentGameState: LuxSDK.GameState;
  actions: {
    command: string;
    agentID: number;
  }[];
}

export const simulateNextTurn = async ({
  currentGameState,
  actions,
}: SimulateNextTurnProps): Promise<LuxSDK.GameState> => {
  // console.log("state 2", JSON.stringify(pseudomatch.state, null, " "));
  const match = await luxSDKStateToMatchDto(currentGameState);
  await match.step(actions);
  const serializedState = (
    match.state as LuxEngine.LuxMatchState
  ).game.toStateObject();
  return serializedStateToSDKStateDTO(serializedState);
};
