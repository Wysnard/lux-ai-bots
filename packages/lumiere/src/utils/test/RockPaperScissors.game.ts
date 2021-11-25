import _ from "lodash";
import { MonteCarloProcessRepositoryDependencies } from "../../process/montecarlo.process";
import { createMonteCarloRootTree } from "../../states/montecarlo.state";

export const possibleActions = ["rock", "paper", "scissors"] as const;
export type RPSAction = typeof possibleActions[number];
export type RPSObservation = {
  turn: number;
  score: { agent: number; opponent: number };
};
export const opponent: Record<RPSAction, number> = {
  rock: 0.8, // 80%
  paper: 0.1, // 10%
  scissors: 0.1, // 10%
};
export const opponentPickAction = (): RPSAction => {
  const s = _.sum(Object.values(opponent));
  const probabilities = Object.entries(opponent) as [RPSAction, number][];
  const random = Math.random() * s;
  let current = 0;
  for (const [action, probability] of probabilities) {
    current += probability;
    if (current > random) {
      return action;
    }
  }
  return probabilities[0][0];
};

export class RockPaperScissorsGameEngine implements RPSObservation {
  private constructor(
    public turn: number,
    public score: { agent: number; opponent: number }
  ) {}

  static create({
    turn = 0,
    score = { agent: 0, opponent: 0 },
  }: Partial<RPSObservation>) {
    return new RockPaperScissorsGameEngine(turn, score);
  }

  static isEnd(state: RockPaperScissorsGameEngine) {
    return state.turn >= 5;
  }

  static update(
    gameState: RockPaperScissorsGameEngine,
    agentAction: RPSAction,
    opponentAction: RPSAction
  ): RPSObservation {
    if (agentAction === opponentAction)
      return RockPaperScissorsGameEngine.create({
        turn: gameState.turn + 1,
        score: {
          agent: gameState.score.agent,
          opponent: gameState.score.opponent,
        },
      });
    if (agentAction === "rock" && opponentAction === "scissors")
      return RockPaperScissorsGameEngine.create({
        turn: gameState.turn + 1,
        score: {
          agent: gameState.score.agent + 1,
          opponent: gameState.score.opponent,
        },
      });
    if (agentAction === "paper" && opponentAction === "rock")
      return RockPaperScissorsGameEngine.create({
        turn: gameState.turn + 1,
        score: {
          agent: gameState.score.agent + 1,
          opponent: gameState.score.opponent,
        },
      });

    if (agentAction === "scissors" && opponentAction === "paper")
      return RockPaperScissorsGameEngine.create({
        turn: gameState.turn + 1,
        score: {
          agent: gameState.score.agent + 1,
          opponent: gameState.score.opponent,
        },
      });
    return RockPaperScissorsGameEngine.create({
      turn: gameState.turn + 1,
      score: {
        agent: gameState.score.agent,
        opponent: gameState.score.opponent + 1,
      },
    });
  }
}

export class Agent<S> {
  gameEngine = RockPaperScissorsGameEngine.create({});

  constructor(public state: S) {}

  run(
    callback: (
      gameState: RockPaperScissorsGameEngine,
      formerState: S
    ) => [RPSAction, any]
  ) {
    while (!RockPaperScissorsGameEngine.isEnd(this.gameEngine)) {
      const [action, newState] = callback(this.gameEngine, this.state);
      RockPaperScissorsGameEngine.update(
        this.gameEngine,
        action,
        opponentPickAction()
      );
      this.state = newState;
    }
  }
}

export const rewardFn: MonteCarloProcessRepositoryDependencies<
  RockPaperScissorsGameEngine,
  RPSAction
>["rewardFn"] = (state) => {
  if (state.observation.score.agent === state.observation.score.opponent)
    return 0.5;
  return state.observation.score.agent > state.observation.score.opponent
    ? 1
    : 0;
};
export const getKeyFromAction: MonteCarloProcessRepositoryDependencies<
  RockPaperScissorsGameEngine,
  RPSAction
>["getKeyFromAction"] = (action) => action;
export const getActionFromKey: MonteCarloProcessRepositoryDependencies<
  RockPaperScissorsGameEngine,
  RPSAction
>["getActionFromKey"] = (key) => key as RPSAction;
export const getAction: MonteCarloProcessRepositoryDependencies<
  RockPaperScissorsGameEngine,
  RPSAction
>["getAction"] = () => possibleActions.map((action) => action);
export const simulate: MonteCarloProcessRepositoryDependencies<
  RockPaperScissorsGameEngine,
  RPSAction
>["simulate"] = {
  state: (state, agentAction, opponentAction) =>
    createMonteCarloRootTree(
      RockPaperScissorsGameEngine.update(
        state.observation,
        agentAction,
        opponentAction
      )
    ),
  agentActions: () => possibleActions.map((action) => action),
  opponentActions: () => possibleActions.map((action) => action),
};
export const model: MonteCarloProcessRepositoryDependencies<
  RockPaperScissorsGameEngine,
  RPSAction
>["model"] = {
  policy: (state) => rewardFn(state),
  value: (state) => state.probability,
};
export const isTerminalState: MonteCarloProcessRepositoryDependencies<
  RockPaperScissorsGameEngine,
  RPSAction
>["isTerminalState"] = (state) =>
  RockPaperScissorsGameEngine.isEnd(state.observation);
export const transitionProbaFn: MonteCarloProcessRepositoryDependencies<
  RockPaperScissorsGameEngine,
  RPSAction
>["transitionProbaFn"] = (
  startState,
  agentAction,
  opponentAction,
  allEndStates
) => {
  return opponent[opponentAction];
};
