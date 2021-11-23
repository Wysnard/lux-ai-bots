import {
  MonteCarloTree,
  pickRandomWeightedOutcomeBranch,
} from "../states/montecarlo.state";
import { MonteCarloProcessRepositoryDependencies } from "../process/montecarlo.process";

export interface MCTSDependencies<O, A> {
  selection: (state: MonteCarloTree<O>) => MonteCarloTree<O>; // Take a root state and return the next state if it is not a leaf otherwise return the input state
  expansion: (state: MonteCarloTree<O>) => MonteCarloTree<O>; // Take a leaf state, make an in-place by adding new branches and return the new state
  simulation: (state: MonteCarloTree<O>) => MonteCarloTree<O>; // rollout of the game until it reaches a terminal state then return the terminal state
  backpropagation: (
    state: MonteCarloTree<O>,
    terminalState: MonteCarloTree<O>
  ) => MonteCarloTree<O>; // backpropagate the result of the simulation
}

export interface MCTSRepository<O, A> extends MCTSDependencies<O, A> {
  simulation: (state: MonteCarloTree<O>) => MonteCarloTree<O>; // rollout of the game until it reaches a terminal state then return the terminal state
}

export const createMCTSRepository = <O, A>({
  selection,
  expansion,
  simulation,
  backpropagation,
}: MCTSDependencies<O, A>): MCTSRepository<O, A> => {
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
  makeSelection = ({ isExpandable, policyFn, getKeyFromAction }) =>
    (state) => {
      if (isExpandable(state)) {
        return state;
      }
      const actionSelected = policyFn(state);
      const outcomeSelected = pickRandomWeightedOutcomeBranch(
        state.branches[getKeyFromAction(actionSelected)]
      );
      return outcomeSelected;
    },
  makeExpansion = ({ isExpandable, tree }) =>
    (state) => {
      if (!isExpandable(state)) {
        throw new Error("The node is not expandable. Come back later boy");
      }
      state.branches = tree.createBranches(state);

      return state;
    },
  makeSimulation = (dep) => {
    const simulation = (state: MonteCarloTree<O>): MonteCarloTree<O> => {
      if (dep.isTerminalState(state)) {
        return state;
      }
      const newBranches = dep.tree.createBranches(state);
      const nextState = dep.tree.createTree({
        ...state,
        branches: newBranches,
      });
      const actionSelected = dep.rolloutFn(nextState);
      const selectedBranch =
        nextState.branches[dep.getKeyFromAction(actionSelected)];
      const outcomeSelected = pickRandomWeightedOutcomeBranch(selectedBranch);

      return simulation(outcomeSelected);
    };

    return simulation;
  },
  makeBackpropagation = ({ rewardFn }) =>
    (state: MonteCarloTree<O>, terminalState: MonteCarloTree<O>) => {
      const reward = rewardFn(terminalState);
      // should we do a gradient descent on the expected value? makeing valueFn a first shot and then we ajust it along the game goes on
      // state.expected_reward =
      //   state.expected_reward * state.visited +
      //   valueFn(state) / state.visited +
      //   1;
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
