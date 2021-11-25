import {
  ExpandedMonteCarloTree,
  MonteCarloTree,
  pickRandomWeightedOutcomeBranch,
} from "../states/montecarlo.state";
import { MonteCarloProcessRepositoryDependencies } from "../process/montecarlo.process";

export interface MCTSDependencies<O, A> {
  selection: (state: ExpandedMonteCarloTree<O, A>) => MonteCarloTree<O, A>; // Take a root state and return the next state if it is not a leaf otherwise return the input state
  expansion: (state: MonteCarloTree<O, A>) => ExpandedMonteCarloTree<O, A>; // Take a leaf state, make an in-place by adding new branches and return the new state
  simulation: (state: MonteCarloTree<O, A>) => MonteCarloTree<O, A>; // rollout of the game until it reaches a terminal state then return the terminal state
  backpropagation: (
    state: MonteCarloTree<O, A>,
    terminalState: MonteCarloTree<O, A>
  ) => MonteCarloTree<O, A>; // backpropagate the result of the simulation
}

export interface MCTSRepository<O, A> extends MCTSDependencies<O, A> {
  simulation: (state: MonteCarloTree<O, A>) => MonteCarloTree<O, A>; // rollout of the game until it reaches a terminal state then return the terminal state
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
  makeSelection = ({
      isExpandable,
      isTerminalState,
      policyFn,
      getKeyFromAction,
    }) =>
    (state) => {
      const actionSelected = policyFn(state);
      const outcomeSelected = pickRandomWeightedOutcomeBranch(
        state.edges.getOutcomesWithAgentAction(actionSelected)
      );
      return outcomeSelected;
    },
  makeExpansion = ({ isExpandable, tree }) =>
    (state) => {
      if (!isExpandable(state)) {
        throw new Error("The node is not expandable. Come back later boy");
      }
      state.edges = tree.createEdge(state);

      return state as ExpandedMonteCarloTree<O, A>;
    },
  makeSimulation = (dep) => {
    const simulation = (state: MonteCarloTree<O, A>): MonteCarloTree<O, A> => {
      if (dep.isTerminalState(state)) {
        return state;
      }
      const newEdge = dep.tree.createEdge(state);
      const newState = dep.tree.createExpandedTree({
        ...state,
        edges: newEdge,
      });
      const actionSelected = dep.rolloutFn(newState);
      const selectedBranch = newEdge.getOutcomesWithAgentAction(actionSelected);
      const outcomeSelected = pickRandomWeightedOutcomeBranch(selectedBranch);

      return simulation(outcomeSelected);
    };

    return simulation;
  },
  makeBackpropagation = ({ rewardFn }) =>
    (state: MonteCarloTree<O, A>, terminalState: MonteCarloTree<O, A>) => {
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
