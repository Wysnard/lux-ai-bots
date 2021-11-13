import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";
import { luxSDKStateToMatchDto } from "./dtos/LuxSDKStateToMatch.dto";
import { serializedStateToSDKStateDTO } from "./dtos/SerializedStateToSDKState.dto";
import _ from "lodash";

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
  const match = await luxSDKStateToMatchDto(currentGameState);
  await match.step(actions);
  const serializedState = (
    match.state as LuxEngine.LuxMatchState
  ).game.toStateObject();
  return serializedStateToSDKStateDTO(serializedState);
};

// 1 worker per team
// worker_actions = 4 actions (move)
// 2 * 4 = actons

// const scenarios = computeAllPossibleScenarios(mapper: (player0Actions, player1Actions) => {simulateNextTurn()}) // Rust | node package => multi threading

// const [[actionPlayer0], [acitonsPlyaer1]] = computeAllPossibleActionsByPlayer(gameState); // actions by player
// const actions = R.combination([actionPlayer0], [acitonsPlyaer1])
// const actions = computeAllPossibleActions() // combination des actions des 2 joueurs
// const nextTurnState = actions.map(() => simulateNextTurn())
