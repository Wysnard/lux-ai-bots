export default (state: MonteCarloTree<O>) =>
  !!state.branches && rewardFn(state) === 0;
