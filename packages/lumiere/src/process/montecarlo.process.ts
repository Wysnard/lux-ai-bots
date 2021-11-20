import R from "ramda";
import _ from "lodash/fp";

import { createUCBRepository, UCBRepository } from "../algorithm/UCB.algorithm";
import {
  CreateMonteCarloTree,
  getFlatKeyedOutComes,
  getOutComes,
  MonteCarloDecisionBranch,
  MonteCarloTree,
  pickRandomWeightedOutcome,
} from "../states/montecarlo.state";
import { PolicyFn, UpdateFn, ValueFn, MarkovDecisionProcess } from "../types";

export interface MCTSDependencies<O, A> {
  selection: (state: MonteCarloTree<O>) => MonteCarloTree<O>; // Q(s,a): current estimate of the value of the state s
  expansion: (state: MonteCarloTree<O>) => MonteCarloTree<O>; // U(s,a): upper bound of the value of the state s
  simulation: (state: MonteCarloTree<O>) => number; // rollout of the game until it reaches a terminal state then return the result
  backpropagation: (
    state: MonteCarloTree<O>,
    reward: number
  ) => MonteCarloTree<O>; // backpropagate the result of the simulation
}

export interface MCTSRepository<O, A> extends MCTSDependencies<O, A> {}

// TODO: remove partial when all default dependencies are implemented in createMonteCarloProcessRepository
export const createMCTSRepository = <O, A>({
  selection = (state: MonteCarloTree<O>) => state,
  expansion = (state: MonteCarloTree<O>) => state,
  simulation = (state: MonteCarloTree<O>) => 1,
  backpropagation = (state: MonteCarloTree<O>, reward: number) => state,
}: Partial<MCTSDependencies<O, A>>): MCTSRepository<O, A> => {
  return {
    selection,
    expansion,
    simulation,
    backpropagation,
  };
};
export interface MCTSRepositoryMaker<O, A> {
  makeSelection: (
    dependencies: Required<MonteCarloProcessRepositoryDependencies<O, A>>
  ) => MCTSRepository<O, A>["selection"];
  makeExpansion: (
    dependencies: Required<MonteCarloProcessRepositoryDependencies<O, A>>
  ) => MCTSRepository<O, A>["expansion"];
  makeSimulation: (
    dependencies: Required<MonteCarloProcessRepositoryDependencies<O, A>>
  ) => MCTSRepository<O, A>["simulation"];
  makeBackpropagation: (
    dependencies: Required<MonteCarloProcessRepositoryDependencies<O, A>>
  ) => MCTSRepository<O, A>["backpropagation"];
}

export const makeMCTSRepository = <O, A>({
  makeSelection = ({ isExpandable, policyFn, getKeyFromAction }) => {
    const selection: MCTSRepository<O, A>["selection"] = (state) => {
      if (isExpandable(state)) {
        return state;
        1;
      }
      const actionSelected = policyFn(state);
      const outcomeSelected = pickRandomWeightedOutcome(
        state.branches[getKeyFromAction(actionSelected)]
      );
      return outcomeSelected;
    };

    return selection;
  },
  makeExpansion = ({
      transitionProbaFn,
      isExpandable,
      simulate,
      getKeyFromAction,
      valueFn,
    }) =>
    (state) => {
      if (!isExpandable(state)) {
        throw new Error("The node is not expandable. Come back later boy");
      }
      const agentActions = simulate.agentActions(state);
      const opponentActions = simulate.opponentActions(state);

      let newBranches: MonteCarloDecisionBranch<O> = {};

      for (const agentAction of agentActions) {
        const keyAction = getKeyFromAction(agentAction);
        newBranches[keyAction] = Array.from({
          length: opponentActions.length,
        });
        const mut = newBranches[keyAction];
        for (let i = 0; i < mut.length; i++) {
          const newOutcome = simulate.state(
            state,
            agentAction,
            opponentActions[i]
          );
          mut[i] = newOutcome;
          mut[i].expected_reward = valueFn(newOutcome);
        }

        const probas = transitionProbaFn(state, agentAction, mut);

        for (let i = 0; i < mut.length; i++) {
          mut[i].probability = probas[i];
        }
      }

      state.branches = newBranches;

      return state;
    },
  makeSimulation = ({
    getKeyFromAction,
    rolloutFn,
    isTerminalState,
    rewardFn,
  }) => {
    const simulation = (state: MonteCarloTree<O>): number => {
      if (isTerminalState(state)) {
        return rewardFn(state);
      }
      const actionSelected = rolloutFn(state);
      const outcomeSelected = pickRandomWeightedOutcome(
        state.branches[getKeyFromAction(actionSelected)]
      );

      return simulation(outcomeSelected);
    };

    return simulation;
  },
  makeBackpropagation = ({ valueFn }) =>
    (state: MonteCarloTree<O>, reward: number) => {
      state.expected_reward = valueFn(state);
      state.win += reward;
      state.visited += 1;
      return state;
    },
}: Partial<MCTSRepositoryMaker<O, A>>): MCTSRepositoryMaker<O, A> => ({
  makeSelection,
  makeExpansion,
  makeSimulation,
  makeBackpropagation,
});

export interface MCMDP<O, A>
  extends Partial<MarkovDecisionProcess<O, MonteCarloTree<O>, A>> {
  getAction: (state: MonteCarloTree<O>) => A[];
  rewardFn: (state: MonteCarloTree<O>) => number;
  transitionProbaFn?: (
    startState: MonteCarloTree<O>,
    action: A,
    allEndStates: MonteCarloTree<O>[]
  ) => number[];
  discount_factor?: number;
}

// rewardFn,
// getAction,

export interface MonteCarloProcessRepositoryDependencies<O, A>
  extends MCMDP<O, A> {
  // mandatory dependencies
  getKeyFromAction: (action: A) => string;
  getActionFromKey: (key: string) => A;
  model: {
    policy: (state: MonteCarloTree<O>) => number; // for a given agent state and action, how promising is the move
    value: ValueFn<MonteCarloTree<O>, A>; // predict/estimate the reward for a given agent state
  };
  simulate: {
    state: (
      state: MonteCarloTree<O>,
      agentAction: A,
      opponentAction: A
    ) => MonteCarloTree<O>;
    agentActions: (state: MonteCarloTree<O>) => A[];
    opponentActions: (state: MonteCarloTree<O>) => A[];
  };
  rewardFn: (state: MonteCarloTree<O>) => number;
  //
  isExpandable?: (state: MonteCarloTree<O>) => boolean;
  isTerminalState?: (state: MonteCarloTree<O>) => boolean;
  createMonteCarloTree?: CreateMonteCarloTree<O>;
  ucb?: UCBRepository<MonteCarloTree<O>, A>;
  policyFn?: PolicyFn<MonteCarloTree<O>, A>; // select which action we should explore
  rolloutFn?: PolicyFn<MonteCarloTree<O>, A>;
  valueFn?: ValueFn<MonteCarloTree<O>, A>;
  updateFn?: UpdateFn<O, MonteCarloTree<O>>;
}

interface MonteCarloProcessMakers<O, A> {
  mctsMaker: MCTSRepositoryMaker<O, A>;
}

export interface MonteCarloProcessRepository<O, A>
  extends MonteCarloProcessRepositoryDependencies<O, A> {
  plan: (state: MonteCarloTree<O>) => MonteCarloTree<O>;
  decide: (state: MonteCarloTree<O>) => A;
}

// Markov Decision Process
export const createMonteCarloProcessRepository = <O, A>({
  // madatory dependencies
  rewardFn,
  getKeyFromAction,
  getActionFromKey,
  simulate,
  getAction,
  model,
  //
  discount_factor = 0.3, //should be a value between 0 and 1
  isTerminalState = (state) => rewardFn(state) !== 0,
  isExpandable = (state: MonteCarloTree<O>) =>
    !!state.branches && rewardFn(state) === 0,
  valueFn = (state: MonteCarloTree<O>) =>
    (1 - discount_factor) * model.value(state) +
    discount_factor * state.win * state.visited, // give the expected_reward to the tree | TODO: complete the equation result : [-1:1]
  transitionProbaFn = (startState, action, allEndStates) => {
    const opponentPositiveValues = allEndStates.map(
      (endState) => (-valueFn(endState) + 1) / 2
    );
    const valuesSum = opponentPositiveValues.reduce(
      (acc, positiveValue) => acc + positiveValue,
      0
    );
    return valuesSum !== 0
      ? opponentPositiveValues.map(
          (opponentPositiveValue) => opponentPositiveValue / valuesSum
        )
      : allEndStates.map(() => 1 / allEndStates.length);
  }, // determine the probability of the next state
  createMonteCarloTree = (observation: O) => ({
    visited: 0,
    win: 0,
    probability: 0,
    expected_reward: 0,
    observation,
    branches: {},
  }),
  ucb = createUCBRepository({
    exploitation: (state: MonteCarloTree<O>) =>
      (state.win * valueFn(state)) / state.visited,
    exploration: (state: MonteCarloTree<O>) => model.policy(state),
  }),
  policyFn = (state) => {
    const fko = getFlatKeyedOutComes(state);
    const mapped_fko = fko.map(
      ([key, value]) =>
        [getActionFromKey(key), value] as [A, MonteCarloTree<O>[]]
    );
    const [action_take] = _.maxBy(
      ([action, outcomes]) =>
        _.sumBy((outcome) => ucb.ucb(outcome, action), outcomes),
      mapped_fko
    ) as [A, MonteCarloTree<O>[]];
    return action_take;
  },
  rolloutFn = policyFn,
  updateFn = (state, observation) =>
    getOutComes(state).find((outcome) => outcome.observation === observation) ||
    createMonteCarloTree({ observation } as any),
  mctsMaker = makeMCTSRepository({}),
}: MonteCarloProcessRepositoryDependencies<O, A> &
  MonteCarloProcessMakers<O, A>): MonteCarloProcessRepository<O, A> => {
  const dependencies: Required<MonteCarloProcessRepositoryDependencies<O, A>> =
    {
      createMonteCarloTree,
      discount_factor,
      getAction,
      getActionFromKey,
      getKeyFromAction,
      isExpandable,
      isTerminalState,
      model,
      policyFn,
      rolloutFn,
      rewardFn,
      simulate,
      transitionProbaFn,
      valueFn,
      updateFn,
      ucb,
    };
  const selection: MCTSRepository<O, A>["selection"] = (state) => {
    if (isExpandable(state)) {
      return state;
    }
    const actionSelected = policyFn(state);
    const outcomeSelected = pickRandomWeightedOutcome(
      state.branches[getKeyFromAction(actionSelected)]
    );
    return selection(outcomeSelected);
  };

  const mcts = createMCTSRepository({
    selection: mctsMaker.makeSelection(dependencies),
    expansion: mctsMaker.makeExpansion(dependencies),
    simulation: mctsMaker.makeSimulation(dependencies),
    backpropagation: mctsMaker.makeBackpropagation(dependencies),
  });

  const plan = (state: MonteCarloTree<O>): MonteCarloTree<O> => {
    // a function that explore possibilities without interacting with the environment (aka reasoning, pondering, thought, search, ...). It have to be called in a loop until you are constrained to stop or you reach a terminal state.
    const expandableState = isExpandable(state)
      ? mcts.expansion(state)
      : plan(mcts.selection(state));

    // simulation
    const reward = mcts.simulation(expandableState);

    // backpropagation
    const newState = mcts.backpropagation(expandableState, reward);

    return newState;
  };

  return {
    ...dependencies,
    plan,
    decide: (state: MonteCarloTree<O>) =>
      getActionFromKey(
        getFlatKeyedOutComes(state).reduce(
          (acc, elem) =>
            elem[1]
              .map((tree) => tree.visited)
              .reduce((acc, visit) => acc + visit) >
            acc[1]
              .map((tree) => tree.visited)
              .reduce((acc, visit) => acc + visit)
              ? elem
              : acc,
          getFlatKeyedOutComes(state)[0]
        )[0]
      ),
  };
};
