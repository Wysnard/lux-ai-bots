import {
  MonteCarloTree,
  pickRandomWeightedOutcomeBranch,
} from "../states/montecarlo.state";
import { MonteCarloProcessRepositoryDependencies } from "../process/montecarlo.process";

export interface MCTSDependencies<O, A> {
  selection: (state: MonteCarloTree<O>) => MonteCarloTree<O>; // Take a root state and return the next state if it is not a leaf otherwise return the input state
  expansion: (state: MonteCarloTree<O>) => MonteCarloTree<O>; // Take a leaf state, make an in-place by adding new branches and return the new state
  simulation: (state: MonteCarloTree<O>) => number; // rollout of the game until it reaches a terminal state then return the result
  backpropagation: (
    state: MonteCarloTree<O>,
    reward: number
  ) => MonteCarloTree<O>; // backpropagate the result of the simulation
}

export interface MCTSRepository<O, A> extends MCTSDependencies<O, A> {
  simulation: (state: MonteCarloTree<O>) => number; // rollout of the game until it reaches a terminal state then return the result
}
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
      }
      const actionSelected = policyFn(state);
      const outcomeSelected = pickRandomWeightedOutcomeBranch(
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
      tree,
    }) =>
    (state) => {
      if (!isExpandable(state)) {
        throw new Error("The node is not expandable. Come back later boy");
      }
      const newBranches = tree.createBranches(state);

      state.branches = newBranches;

      return state;
    },
  makeSimulation = (dep) => {
    const simulation = (state: MonteCarloTree<O>): number => {
      if (dep.isTerminalState(state)) {
        return dep.rewardFn(state);
      }
      console.log("state", state);
      // I think as the roollout select his action from branches in state and state does not have branches it select shit
      const actionSelected = dep.rolloutFn(state);
      // we need to create next branches before select in it
      const newBranches = dep.tree.createBranches(state);
      console.log("newBranches :", newBranches);
      const selectedBranch =
        // state.branches[dep.getKeyFromAction(actionSelected)] ||
        newBranches[dep.getKeyFromAction(actionSelected)];
      console.log("selectedBranch :", selectedBranch);
      const outcomeSelected = pickRandomWeightedOutcomeBranch(selectedBranch);

      return simulation(outcomeSelected);
    };

    return simulation;
  },
  makeBackpropagation = ({ valueFn }) =>
    (state: MonteCarloTree<O>, reward: number) => {
      state.expected_reward =
        state.expected_reward * state.visited +
        valueFn(state) / state.visited +
        1;
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
