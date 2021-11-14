export type ProbabilisticRewardFunction = <S, T>(
  startingState: S,
  actionsTaken: T[],
  endState: S,
  reward: number
) => number;

export type ResultBasedRewardFunction = <S, T>(
  startingState: S,
  actionsTaken: T[],
  endState: S
) => number;

export type ActionBasedRewardFunction = <S, T>(
  startingState: S,
  actionsTaken: T[]
) => number;

export type StateBasedRewardFunction = <S>(state: S) => number;

export type DeterministicRewardFunction<S, T> =
  | ResultBasedRewardFunction<S, T>
  | ResultBasedRewardFunction<S, T>
  | ActionBasedRewardFunction<S>;

export type RewardFunction<S, T> =
  | ProbabilisticRewardFunction<S, T>
  | DeterministicRewardFunction<S, T>;
