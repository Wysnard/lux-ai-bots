import R from "ramda";
import _ from "lodash/fp";

import { createUCBRepository, UCBRepository } from "../algorithm/UCB.algorithm";
import {
  createMonteCarloTreeRepository,
  getFlatKeyedOutComes,
  getOutComes,
  MonteCarloDecisionBranch,
  MonteCarloTree,
  MonteCarloTreeRepository,
} from "../states/montecarlo.state";
import { PolicyFn, UpdateFn, ValueFn, MarkovDecisionProcess } from "../types";
import {
  MCTSRepositoryMaker,
  MCTSRepository,
  makeMCTSRepository,
  createMCTSRepository,
} from "../algorithm/MCTS.algorithm";

export interface MCMDP<O, A>
  extends Partial<MarkovDecisionProcess<O, MonteCarloTree<O>, A>> {
  getAction: (state: MonteCarloTree<O>) => A[];
  rewardFn: (state: MonteCarloTree<O>) => number;
  transitionProbaFn?: (
    startState: MonteCarloTree<O>,
    action: A,
    endState: A,
    allEndStates: readonly MonteCarloTree<O>[]
  ) => number;
  discount_factor?: number;
}

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
  isTerminalState: (state: MonteCarloTree<O>) => boolean;
  //
  isExpandable?: (state: MonteCarloTree<O>) => boolean;
  tree?: MonteCarloTreeRepository<O>;
  ucb?: UCBRepository<MonteCarloTree<O>, A>;
  policyFn?: PolicyFn<MonteCarloTree<O>, A>; // select which action we should explore
  rolloutFn?: PolicyFn<MonteCarloTree<O>, A>;
  valueFn?: ValueFn<MonteCarloTree<O>, A>;
  updateFn?: UpdateFn<O, MonteCarloTree<O>>;
}

interface MonteCarloProcessMakers<O, A> {
  mctsMaker?: MCTSRepositoryMaker<O, A>;
}

export interface MonteCarloProcessRepository<O, A>
  extends Required<MonteCarloProcessRepositoryDependencies<O, A>> {
  mcts: MCTSRepository<O, A>;
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
  isTerminalState,
  //
  discount_factor = 0.3, //should be a value between 0 and 1
  isExpandable = (state: MonteCarloTree<O>) =>
    !!state.branches && !isTerminalState(state),
  valueFn = (state: MonteCarloTree<O>) =>
    (1 - discount_factor) * model.value(state) + discount_factor * state.win, // give the expected_reward to the tree | TODO: complete the equation result : [-1:1]
  transitionProbaFn = (
    startState,
    agentAction,
    opponentAction,
    allEndStates
  ) => {
    const opponentPositiveValues = allEndStates.map(
      (endState) => (-valueFn(endState) + 1) / 2
    );
    const valuesSum = opponentPositiveValues.reduce(
      (acc, positiveValue) => acc + positiveValue,
      0
    );
    return 1 / allEndStates.length;
  }, // determine the probability of the next state
  tree = createMonteCarloTreeRepository({
    createBranches: (state) => {
      const agentActions = simulate.agentActions(state);
      const opponentActions = simulate.opponentActions(state);

      let newBranches: MonteCarloDecisionBranch<O> = {};

      for (const agentAction of agentActions) {
        const keyAction = getKeyFromAction(agentAction);
        newBranches[keyAction] = Array.from({
          length: opponentActions.length,
        });
        const branch = newBranches[keyAction];
        for (let i = 0; i < branch.length; i++) {
          const newOutcome = simulate.state(
            state,
            agentAction,
            opponentActions[i]
          );
          branch[i] = newOutcome;
          branch[i].expected_reward = valueFn(newOutcome);
        }

        for (let i = 0; i < branch.length; i++) {
          branch[i].probability = transitionProbaFn(
            state,
            agentAction,
            opponentActions[i],
            branch
          );
        }
      }

      return newBranches;
    },
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
  rolloutFn = (state) => _.pipe(Object.keys, _.shuffle, R.head)(state.branches),
  updateFn = (state, observation) =>
    getOutComes(state).find((outcome) => outcome.observation === observation) ||
    tree.createRoot(observation),
  mctsMaker = makeMCTSRepository({}),
}: MonteCarloProcessRepositoryDependencies<O, A> &
  MonteCarloProcessMakers<O, A>): MonteCarloProcessRepository<O, A> => {
  const dependencies: Required<MonteCarloProcessRepositoryDependencies<O, A>> =
    {
      tree,
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

  const mcts = createMCTSRepository<O, A>({
    selection: mctsMaker.makeSelection(dependencies),
    expansion: mctsMaker.makeExpansion(dependencies),
    simulation: mctsMaker.makeSimulation(dependencies),
    backpropagation: mctsMaker.makeBackpropagation(dependencies),
  });

  const plan: MonteCarloProcessRepository<O, A>["plan"] = (state) => {
    // a function that explore possibilities without interacting with the environment (aka reasoning, pondering, thought, search, ...). It have to be called in a loop until you are constrained to stop or you reach a terminal state.
    const terminalState = !isExpandable(state)
      ? //selection
        plan(mcts.selection(state))
      : // expansion then simulation
        R.compose(mcts.simulation, mcts.expansion)(state);

    // backpropagation
    const newState = mcts.backpropagation(state, terminalState);

    return terminalState;
  };

  return {
    ...dependencies,
    mcts,
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
