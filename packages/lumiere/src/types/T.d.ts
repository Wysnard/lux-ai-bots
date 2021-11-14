export type ProbabilisticTransitionFunction = <S, A>(
  startingState: S,
  actionsTaken: A[],
  endState: S
) => number | number[];

export type DeterministicTransitionFunction = <S>(
  state: S,
  action: string
) => S;

export type TransitionFunction<S, A> =
  | ProbabilisticTransitionFunction<S, A>
  | DeterministicTransitionFunction<S>;
