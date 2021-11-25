import R from "ramda";
import _ from "lodash/fp";

import { createUCBRepository, UCBRepository } from "../algorithm/UCB.algorithm";
import {
  createMonteCarloTreeRepository,
  ExpandedMonteCarloTree,
  MonteCarloDecisionBranch,
  MonteCarloTree,
  MontecarloTreeEdge,
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
  extends Partial<MarkovDecisionProcess<O, MonteCarloTree<O, A>, A>> {
  getAction: (state: MonteCarloTree<O, A>) => A[];
  rewardFn: (state: MonteCarloTree<O, A>) => number;
  transitionProbaFn?: (
    startState: MonteCarloTree<O, A>,
    action: A,
    endState: A,
    allEndStates: readonly MonteCarloTree<O, A>[]
  ) => number;
  discount_factor?: number;
}

// Note: when monte carlo tree is required, it means that the tree has to have edges/branches
export interface MonteCarloProcessRepositoryDependencies<O, A>
  extends MCMDP<O, A> {
  // mandatory dependencies
  getKeyFromAction: (action: A) => string;
  getActionFromKey: (key: string) => A;
  model: {
    policy: (state: MonteCarloTree<O, A>) => number; // for a given agent state and action, how promising is the move
    value: (state: MonteCarloTree<O, A>) => number; // predict/estimate the reward for a given agent state
  };
  simulate: {
    state: (
      state: MonteCarloTree<O, A>,
      agentAction: A,
      opponentAction: A
    ) => MonteCarloTree<O, A>;
    agentActions: (state: MonteCarloTree<O, A>) => A[];
    opponentActions: (state: MonteCarloTree<O, A>) => A[];
  };
  rewardFn: (state: MonteCarloTree<O, A>) => number;
  isTerminalState: (state: MonteCarloTree<O, A>) => boolean;
  //
  isExpandable?: (state: MonteCarloTree<O, A>) => boolean;
  tree?: MonteCarloTreeRepository<O, A>;
  ucb?: UCBRepository<MonteCarloTree<O, A>, A>;
  policyFn?: PolicyFn<ExpandedMonteCarloTree<O, A>, A>; // select which action we should explore
  rolloutFn?: PolicyFn<ExpandedMonteCarloTree<O, A>, A>;
  valueFn?: ValueFn<MonteCarloTree<O, A>, A>;
  updateFn?: UpdateFn<O, ExpandedMonteCarloTree<O, A>, MonteCarloTree<O, A>>;
}

interface MonteCarloProcessMakers<O, A> {
  mctsMaker?: MCTSRepositoryMaker<O, A>;
}

export interface MonteCarloProcessRepository<O, A>
  extends Required<MonteCarloProcessRepositoryDependencies<O, A>> {
  mcts: MCTSRepository<O, A>;
  plan: (state: MonteCarloTree<O, A>) => MonteCarloTree<O, A>;
  decide: (state: ExpandedMonteCarloTree<O, A>) => A;
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
  isExpandable = (state: MonteCarloTree<O, A>) =>
    !state.edges && !isTerminalState(state),
  valueFn = (state: MonteCarloTree<O, A>) =>
    (1 - discount_factor) * model.value(state) + discount_factor * state.win, // give the expected_reward to the tree | TODO: complete the equation result : [-1:1]
  transitionProbaFn = (
    startState,
    agentAction,
    opponentAction,
    allEndStates
  ) => {
    return 1 / allEndStates.length;
  }, // determine the probability of the next state
  tree = createMonteCarloTreeRepository({
    createEdge: (state) =>
      MontecarloTreeEdge.create<O, A>({
        state,
        transitionProbaFn,
        simulate,
        valueFn,
        getKeyFromAction,
        getActionFromKey,
      }),
  }),
  ucb = createUCBRepository({
    exploitation: (state: MonteCarloTree<O, A>, action: A) =>
      (state.win * valueFn(state, action)) / state.visited || 0,
    exploration: (state: MonteCarloTree<O, A>) => model.policy(state),
  }),
  policyFn = (state) => {
    const fko = Object.entries(state.edges.getOutcomesByAgentAction());
    const mapped_fko = fko.map(([key, value]): [A, number] => {
      const action = getActionFromKey(key);
      return [action, _.sumBy((outcome) => ucb.ucb(outcome, action), value)];
    });
    const tuple = _.maxBy(([action, sum]) => sum, mapped_fko);
    if (!tuple) {
      throw new Error("no action found");
    }
    return tuple[0];
  },
  rolloutFn = (state) => {
    const keys = Object.keys(state.edges.getOutcomesByAgentAction());
    const actions = keys.map(getActionFromKey);
    const shuffledActions = _.shuffle(actions);
    const selectedAction = shuffledActions[0];
    return selectedAction;
  },
  updateFn = (state, observation) =>
    state.edges
      .getOutcomes()
      .find((outcome) => outcome.observation === observation) ||
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

  const isNotTerminalState = (state: MonteCarloTree<O, A>) =>
    !isTerminalState(state);

  const plan: MonteCarloProcessRepository<O, A>["plan"] = (state) => {
    // a function that explore possibilities without interacting with the environment (aka reasoning, pondering, thought, search, ...). It have to be called in a loop until you are constrained to stop or you reach a terminal state.
    console.log("state", state);
    console.log("!!state.edges", !!state.edges);
    const terminalState = !!state.edges
      ? //selection
        plan(mcts.selection(state as any))
      : // expansion then simulation
        R.compose(
          mcts.simulation,
          R.when(isNotTerminalState, mcts.expansion)
        )(state);

    // backpropagation
    const newState = mcts.backpropagation(state, terminalState);

    return terminalState;
  };

  return {
    ...dependencies,
    mcts,
    plan,
    decide: (state) => {
      const entries = Object.entries(state.edges.getOutcomesByAgentAction());
      const summed_entries = entries.map(
        ([key, value]) =>
          [key, _.sumBy(({ expected_reward }) => expected_reward, value)] as [
            string,
            number
          ]
      );
      const ret = _.maxBy(([, sum]) => sum, summed_entries);
      if (!ret) {
        throw new Error("no action available");
      }
      return getActionFromKey(ret[0]);
    },
  };
};
