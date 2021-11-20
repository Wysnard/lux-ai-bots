// Upper confidence bounds implementation
// cf Wikipedia article: https://en.wikipedia.org/wiki/Multi-armed_bandit

export interface UCBDependencies<S, A> {
  exploitation: (sate: S, action: A) => number; // Q(s,a): current estimate of the value of the state s,
  exploration: (sate: S, action: A) => number; // U(s,a): upper bound of the value of the state s
}

export interface UCBRepository<S, A> extends UCBDependencies<S, A> {
  ucb: (state: S, action: A) => number;
}

export const createUCBRepository = <S, A>({
  exploitation = (state, action) => 1,
  exploration = (state, action) => 1,
}: Partial<UCBDependencies<S, A>>): UCBRepository<S, A> => ({
  exploitation,
  exploration,
  ucb: (state: S, action: A) =>
    exploitation(state, action) + exploration(state, action),
});
