import {
  CreateMonteCarloBranch,
  CreateMonteCarloTree,
  getFlatKeyedOutComes,
  getOutComes,
  MonteCarloTree,
} from "../states/montecarlo.state";
import { PolicyFn, UpdateFn, ValueFn } from "../types";

interface MonteCarloProcessRepositoryDependencies<O, A> {
  getKeyFromAction: (action: A) => string;
  getActionFromKey: (key: string) => A;
  createMonteCarloTree: CreateMonteCarloTree<O>;
  createMonteCarloBranch: CreateMonteCarloBranch<O, A>;
  simulate: {
    state: (
      state: MonteCarloTree<O>,
      agentAction: A,
      opponentAction: A
    ) => MonteCarloTree<O>;
    agentActions: (state: MonteCarloTree<O>) => A[];
    opponentActions: (state: MonteCarloTree<O>) => A[];
  };
  mcts: {
    exploitation: (state: MonteCarloTree<O>, action: A) => number; // Q(s,a): current estimate of the value of the state s
    exploration: (state: MonteCarloTree<O>, action: A) => number; // U(s,a): upper bound of the value of the state s
    simulation: (state: MonteCarloTree<O>) => number;
    backpropagation: (state: MonteCarloTree<O>) => MonteCarloTree<O>;
  };
  policyFn: PolicyFn<MonteCarloTree<O>, A>;
  model: {
    policy: (state: MonteCarloTree<O>, action: A) => number; // for a given agent state and action, how promising is the move
    value: ValueFn<MonteCarloTree<O>, A>; // predict/estimate the reward for a given agent state
  };
  valueFn: ValueFn<MonteCarloTree<O>, A>;
  updateFn: UpdateFn<O, MonteCarloTree<O>>;
}

// Markov Decision Process
export const createMonteCarloProcessRepository = <O, A>({
  getKeyFromAction,
  getActionFromKey,
  createMonteCarloTree = (observation: O) => ({
    visited: 0,
    win: 0,
    probability: 0,
    expected_reward: 0,
    observation,
    get esperance() {
      return this.probability * (this.win / this.visited) || 0;
    },
    branches: {},
  }),
  createMonteCarloBranch = (agentAction, opponentAction, outcome) =>
    ({
      agentAction,
      opponentAction,
      outcome,
    } as any),
  simulate,
  model,
  mcts: {
    exploitation = (state: MonteCarloTree<O>, action: A) =>
      model.policy(state, action) / (1 + state.visited),
    exploration = (state: MonteCarloTree<O>, action: A) =>
      1 / state.visited + state.visited * state.expected_reward,
    simulation,
    backpropagation,
  },
  policyFn = (state) =>
    getActionFromKey(
      getFlatKeyedOutComes(state).reduce(
        (acc, elem) => (elem[1].esperance > acc[1].esperance ? elem : acc),
        getFlatKeyedOutComes(state)[0]
      )[0]
    ),
  valueFn = (state: MonteCarloTree<O>) => (1 - 0.3) * model.value(state) + 0.3, // give the expected_reward to the tree | TODO: complete the equation
  updateFn = (state, observation) =>
    getOutComes(state).find((outcome) => outcome.observation === observation) ||
    createMonteCarloTree({ observation } as any),
}: MonteCarloProcessRepositoryDependencies<O, A>) => {
  const plan = (state: MonteCarloTree<O>): MonteCarloTree<O> => {
    // a function that explore possibilities without interacting with the environment (aka reasoning, pondering, thought, search, ...). It have to be called in a loop until you are constrained to stop or you reach a terminal state.
    const agentAction = policyFn(state); // return a action with empty state
    const opponentActions = simulate.opponentActions(state);
    const newOutcomes = opponentActions.map((opponentAction) => [
      opponentAction,
      simulate.state(state, agentAction, opponentAction),
    ]);
    const newTwig = Object.fromEntries(newOutcomes);
    const newBranch = {
      branches: {
        [getKeyFromAction(agentAction)]: {
          ...state.branches[getKeyFromAction(agentAction)],
          ...newTwig,
        },
      },
    };

    const nextStep = state;

    const nodeToSimulate = nextStep.visited ? plan(nextStep) : nextStep; // Looking for a leaf node to simulate

    return state;
  };
  return {
    createMonteCarloTree,
    createMonteCarloBranch,
    policyFn,
    valueFn,
    updateFn,
    exploration,
    exploitation,
    plan,
    decide: (state: MonteCarloTree<O>) =>
      getActionFromKey(
        getFlatKeyedOutComes(state).reduce(
          (acc, elem) => (elem[1].visited > acc[1].visited ? elem : acc),
          getFlatKeyedOutComes(state)[0]
        )[0]
      ),
  };
};
