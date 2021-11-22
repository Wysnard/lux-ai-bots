// TODO: WE SHOULD SERIOUSLY WRITE THIS IN RUST BECAUSE JS MAP<MAP> SUCKS ASS REALLY
// We have to put key as a string because we can't put objects or use generic primitives
// Unnfortunaltely, We have to put string as our key type but would love to put a generic type
// and we can't use Map because the key use a shallow equal. in face in this case we use string but it would be much more optimized to use string[] for our actions
export interface MonteCarloDecisionBranch<O> {
  [key: string]: MonteCarloTree<O>[]; // = outcomes
}
export interface MonteCarloTree<O> {
  visited: number;
  win: number;
  expected_reward: number; // result of value function
  probability: number; // probability to happen
  observation: O; // GameState
  branches: MonteCarloDecisionBranch<O>;
}

export type CreateMonteCarloTree<O> = (observation: O) => MonteCarloTree<O>;

export const createMonteCarloTree = <O>(observation: O) => ({
  visited: 0,
  win: 0,
  probability: 0,
  expected_reward: 0,
  observation,
  branches: {},
});

export type CreateMonteCarloBranch<O> = (
  state: MonteCarloTree<O>
) => MonteCarloDecisionBranch<O>;

export const getOutComes = <O>(state: MonteCarloTree<O>) =>
  Object.values(state.branches).flatMap((branch) => branch);

export const getFlatKeyedOutComes = <O>(
  state: MonteCarloTree<O>
): [string, MonteCarloTree<O>[]][] => Object.entries(state.branches);

export const pickRandomWeightedOutcomeBranch = <O>(
  state: MonteCarloTree<O>[]
): MonteCarloTree<O> => {
  const total = state.reduce((acc, curr) => acc + curr.probability, 0);
  const random = Math.random();
  let sum = 0;
  for (const outcome of state) {
    sum += outcome.probability;
    if (random < sum / total) {
      return outcome;
    }
  }
  return state[0];
};
