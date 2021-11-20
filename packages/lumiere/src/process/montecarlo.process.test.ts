import _ from "lodash";
import { pickRandomWeightedOutcome } from "../states/montecarlo.state";
import {
  createMonteCarloProcessRepository,
  createMCTSRepository,
  MonteCarloProcessRepository,
  MonteCarloProcessRepositoryDependencies,
} from "./montecarlo.process";

describe("Monte Carlo Test", () => {
  describe("Rock paper scissors game", () => {
    const possibleActions = ["rock", "paper", "scissors"] as const;
    const opponent = {
      rock: 0.8, // 80%
      paper: 0.1, // 10%
      scissors: 0.1, // 10%
    };
    type TAction = typeof possibleActions[number];
    type TObservation = { turn: number; agent: TAction; opponent: TAction };

    const rewardFn: MonteCarloProcessRepositoryDependencies<
      TObservation,
      TAction
    >["rewardFn"] = (state) => {
      if (state.observation.agent === state.observation.opponent) return 0;
      if (
        state.observation.agent === "rock" &&
        state.observation.opponent === "scissors"
      )
        return 1;
      if (
        state.observation.agent === "paper" &&
        state.observation.opponent === "rock"
      )
        return 1;
      if (
        state.observation.agent === "scissors" &&
        state.observation.opponent === "paper"
      )
        return 1;
      return -1;
    };
    const getKeyFromAction: MonteCarloProcessRepositoryDependencies<
      TObservation,
      TAction
    >["getKeyFromAction"] = (action) => action;
    const getActionFromKey: MonteCarloProcessRepositoryDependencies<
      TObservation,
      TAction
    >["getActionFromKey"] = (key) => key as TAction;
    const getAction: MonteCarloProcessRepositoryDependencies<
      TObservation,
      TAction
    >["getAction"] = () => possibleActions;
    const simulate: MonteCarloProcessRepositoryDependencies<
      TObservation,
      TAction
    >["simulate"] = {
      state: (state) => state,
      agentActions: () => possibleActions.map((action) => action),
      opponentActions: () => possibleActions.map((action) => action),
    };
    const model: MonteCarloProcessRepositoryDependencies<
      TObservation,
      TAction
    >["model"] = {
      policy: (state) => rewardFn(state),
      value: (state) => state.probability * rewardFn(state),
    };

    const repository = createMonteCarloProcessRepository<TObservation, TAction>(
      {
        rewardFn,
        getKeyFromAction,
        getActionFromKey,
        getAction,
        simulate,
        model,
      }
    );
    it("should create a Monte Carlo Process", () => {
      expect(repository).toBeDefined();
    });
  });
});
