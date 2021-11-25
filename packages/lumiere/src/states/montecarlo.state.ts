import { MonteCarloProcessRepositoryDependencies } from "../process/montecarlo.process";

// Make it easier to write a custom data structure
export interface MonteCarloDecisionEdge<O, A> {
  getKeyFromAction(action: A): string;
  getActionFromKey(key: string): A;
  getOutcomesByAgentAction(): MonteCarloDecisionBranch<O, A>;
  getOutcomesWithAgentAction(action: A): MonteCarloTree<O, A>[];
  getOutcomesByOpponentAction(): MonteCarloDecisionBranch<O, A>;
  getOutcomesWithOpponentAction(action: A): MonteCarloTree<O, A>[];
  getOutcome(agentAction: A, opponentAction: A): MonteCarloTree<O, A>;
  getOutcomes(): MonteCarloTree<O, A>[];
}

interface MontecarloTreeEdgeData<O, A> {
  // agent action as key
  [key: string]: {
    // opponent action as key
    [key: string]: MonteCarloTree<O, A>;
  };
}

interface MontecarloTreeEdgeFactoryProps<O, A> {
  getActionFromKey: (key: string) => A;
  getKeyFromAction: (action: A) => string;
  state: MonteCarloTree<O, A>;
  simulate: MonteCarloProcessRepositoryDependencies<O, A>["simulate"];
  valueFn: Required<MonteCarloProcessRepositoryDependencies<O, A>>["valueFn"];
  transitionProbaFn: Required<
    MonteCarloProcessRepositoryDependencies<O, A>
  >["transitionProbaFn"];
}
export class MontecarloTreeEdge<O, A> implements MonteCarloDecisionEdge<O, A> {
  private constructor(
    public readonly getActionFromKey: (key: string) => A,
    public readonly getKeyFromAction: (action: A) => string,
    private readonly data: MontecarloTreeEdgeData<O, A>,
    private readonly outcomeByAgentAction: MonteCarloDecisionBranch<O, A>,
    private readonly outcomeByOpponentAction: MonteCarloDecisionBranch<O, A>
  ) {}

  static create<O, A>({
    state,
    simulate,
    valueFn,
    transitionProbaFn,
    getActionFromKey,
    getKeyFromAction,
  }: MontecarloTreeEdgeFactoryProps<O, A>): MontecarloTreeEdge<O, A> {
    const agentActions = simulate.agentActions(state);
    const opponentActions = simulate.opponentActions(state);

    let edge: MontecarloTreeEdgeData<O, A> = {};
    let outcomeByAgentAction: MonteCarloDecisionBranch<O, A> = {};
    let outcomeByOpponentAction: MonteCarloDecisionBranch<O, A> = {};

    for (const agentAction of agentActions) {
      const key = getKeyFromAction(agentAction);
      for (const opponentAction of opponentActions) {
        const subkey = getKeyFromAction(opponentAction);
        const newOutcome = simulate.state(state, agentAction, opponentAction);
        newOutcome.expected_reward = valueFn(newOutcome, agentAction);
        edge[key] ||= {};
        edge[key][subkey] = newOutcome;
        outcomeByAgentAction[key] ||= [];
        outcomeByAgentAction[key].push(newOutcome);
        outcomeByOpponentAction[subkey] ||= [];
        outcomeByOpponentAction[subkey].push(newOutcome);
      }

      for (let i = 0; i < outcomeByAgentAction[key].length; i++) {
        outcomeByAgentAction[key][i].probability = transitionProbaFn(
          state,
          agentAction,
          opponentActions[i],
          outcomeByAgentAction[key]
        );
      }
    }

    return new MontecarloTreeEdge(
      getActionFromKey,
      getKeyFromAction,
      edge,
      outcomeByAgentAction,
      outcomeByOpponentAction
    );
  }

  getOutcomesByAgentAction(): MonteCarloDecisionBranch<O, A> {
    return this.outcomeByAgentAction;
  }

  getOutcomesWithAgentAction(action: A): MonteCarloTree<O, A>[] {
    return this.getOutcomesByAgentAction()[this.getKeyFromAction(action)];
  }

  getOutcomesByOpponentAction(): MonteCarloDecisionBranch<O, A> {
    return this.outcomeByOpponentAction;
  }

  getOutcomesWithOpponentAction(action: A): MonteCarloTree<O, A>[] {
    return this.getOutcomesByOpponentAction()[this.getKeyFromAction(action)];
  }

  getOutcomes(): MonteCarloTree<O, A>[] {
    return Object.values(this.getOutcomesByAgentAction()).flat();
  }

  getOutcome(agentAction: A, opponentAction: A): MonteCarloTree<O, A> {
    return this.data[this.getKeyFromAction(agentAction)][
      this.getKeyFromAction(opponentAction)
    ];
  }
}

// TODO: WE SHOULD SERIOUSLY WRITE THIS IN RUST BECAUSE JS MAP<MAP> SUCKS ASS REALLY
// We have to put key as a string because we can't put objects or use generic primitives
// Unnfortunaltely, We have to put string as our key type but would love to put a generic type
// and we can't use Map because the key use a shallow equal. in face in this case we use string but it would be much more optimized to use string[] for our actions
export interface MonteCarloDecisionBranch<O, A> {
  [key: string]: MonteCarloTree<O, A>[]; // = outcomes
}
export interface UnexpandedMonteCarloTree<O, A> {
  visited: number;
  win: number;
  expected_reward: number; // result of value function
  probability: number; // probability to happen
  observation: O; // GameState
}
export interface MonteCarloTree<O, A> extends UnexpandedMonteCarloTree<O, A> {
  edges?: MonteCarloDecisionEdge<O, A>;
}

export interface ExpandedMonteCarloTree<O, A> extends MonteCarloTree<O, A> {
  edges: MonteCarloDecisionEdge<O, A>;
}

export type UnexpandedObservationNeeded<O, A> = Pick<
  UnexpandedMonteCarloTree<O, A>,
  "observation"
> &
  Partial<Omit<UnexpandedMonteCarloTree<O, A>, "observation">>;

export type ObservationNeeded<O, A> = Pick<
  ExpandedMonteCarloTree<O, A>,
  "observation"
> &
  Partial<Omit<ExpandedMonteCarloTree<O, A>, "observation">>;

export type ExpandedObservationNeeded<O, A> = Pick<
  ExpandedMonteCarloTree<O, A>,
  "observation" | "edges"
> &
  Partial<Omit<ExpandedMonteCarloTree<O, A>, "observation">>;

export type CreateMonteCarloTree<O, A> = (
  tree: ObservationNeeded<O, A>
) => MonteCarloTree<O, A>;

export const createMonteCarloTree = <O, A>({
  win = 0,
  visited = 0,
  expected_reward = 0,
  probability = 0,
  observation,
  edges,
}: ObservationNeeded<O, A>): MonteCarloTree<O, A> => {
  return {
    win,
    visited,
    expected_reward,
    probability,
    observation,
    edges,
  };
};

export type CreateMonteCarloRootTree<O, A> = (
  observation: O
) => MonteCarloTree<O, A>;

export const createMonteCarloRootTree = <O, A>(observation: O) =>
  createMonteCarloTree<O, A>({ observation });

export type CreateExpandedMonteCarloTree<O, A> = (
  tree: ObservationNeeded<O, A>
) => ExpandedMonteCarloTree<O, A>;

// export const createExpandedMonteCarloTree = <O, A>(
//   tree: ExpandedObservationNeeded<O, A>
// ): ExpandedMonteCarloTree<O, A> => ({
//   ...createMonteCarloTree<O, A>(tree),
//   edges: tree.edges,
// });

export type CreateMonteCarloEdge<O, A> = (
  state: MonteCarloTree<O, A>
) => MonteCarloDecisionEdge<O, A>;

export type CreateMonteCarloBranch<O, A> = (
  state: MonteCarloTree<O, A>
) => MonteCarloDecisionBranch<O, A>;

export interface MonteCarloTreeDependencies<O, A> {
  createTree?: CreateMonteCarloTree<O, A>;
  createExpandedTree?: CreateExpandedMonteCarloTree<O, A>;
  createRoot?: CreateMonteCarloRootTree<O, A>;
  createEdge: CreateMonteCarloEdge<O, A>;
}

export type MonteCarloTreeRepository<O, A> = Required<
  MonteCarloTreeDependencies<O, A>
>;

export const createMonteCarloTreeRepository = <O, A>({
  createEdge,
  createTree = createMonteCarloTree,
  createExpandedTree = (tree) => {
    const created = createTree(tree);

    return {
      ...created,
      edges: tree.edges || createEdge(created),
    };
  },
  createRoot = createMonteCarloRootTree,
}: MonteCarloTreeDependencies<O, A>): MonteCarloTreeRepository<O, A> => ({
  createTree,
  createExpandedTree,
  createRoot,
  createEdge,
});

export const pickRandomWeightedOutcomeBranch = <O, A>(
  state: MonteCarloTree<O, A>[]
): MonteCarloTree<O, A> => {
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
