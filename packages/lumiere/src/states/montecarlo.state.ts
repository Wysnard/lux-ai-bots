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

export type CreateMonteCarloBranch<O, A> = (
  agentAction: A,
  opponentActions: A[],
  outcome: MonteCarloTree<O>
) => MonteCarloTree<O>;

export const getOutComes = <O>(state: MonteCarloTree<O>) =>
  Object.values(state.branches).flatMap((branch) => branch);

export const getFlatKeyedOutComes = <O>(
  state: MonteCarloTree<O>
): [string, MonteCarloTree<O>[]][] => Object.entries(state.branches);

export const pickRandomWeightedOutcome = <O>(
  state: MonteCarloTree<O>[]
): MonteCarloTree<O> => {
  const sum = state.reduce((acc, cur) => acc + cur.probability, 0);
  const random = Math.random() * sum;
  let current = 0;
  for (const outcome of state) {
    current += outcome.probability;
    if (current > random) {
      return outcome;
    }
  }
  return state[0];
};
