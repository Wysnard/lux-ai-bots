export interface MarkovDecisionProcess<S, A> {
  readonly agentState: S; // specific to the process: IS should be a monad such as IS<S>
  getActionSet: (state: S) => A[]; // [pure function] given a state, return all possible actions for the agent
  simulateFn: (state: S, action: A) => S[]; // [pure function] given a state and an action from the agent, return the next possible states
  transitionFn: (startState: S, action: A, endState: S) => number; // [pure function] given a starting state, an action and an ending state, return the probability [0;1] of the transition (ici le NN)
  rewardFn: (startState: S, action: A, endState: S) => number; // [pure function] given a starting state, an action and an ending state, return the reward (reward function, cost function, regret function, etc...)
  policyFn?: (state: S) => A; // [pure function] (default greedy) given a state, return the best action for the agent
  valueFn?: (state: S) => number; // [pure function] given a state, return the value of the state  => [-1;1] (ici le NN)
}

// Policy function:
// const actions = getActionSet(startState);
// const possibleOutComeStates = actions.map(action => simulateFn(startState, action));
// const transitionProbabilities = R.zip(actions, possibleOutComeStates).map([action, possibleState] => transitionFn(startState, action, possibleState));
// const rewards = possibleOutComeStates.map(possibleState => rewardFn(possibleState));

// Greedy Specific:
// const spec = R.zip(probabilities, rewards, possibleOutComeStates).map([probability, reward, possibleOutComeStates] => ({hope: probability * reward, possibleOutComeStates}));
// maxby hope
// return best

// export type MarkovDecisionProcessFactory<FP, IS, S, A> = (
//   factoryProps: Readonly<FP>
// ) => MarkovDecisionProcess<IS, S, A>;

// export interface MarkovDecisionProcessRepositoryMaker<MP, IS, S, A> {
//   makeGetActionSet: (
//     factoryProps: Readonly<MP>
//   ) => MarkovDecisionProcess<IS, S, A>["getActionSet"];
//   makeRewardFn: (
//     factoryProps: Readonly<MP>
//   ) => MarkovDecisionProcess<IS, S, A>["rewardFn"];
//   makeSimulateFn: (
//     factoryProps: Readonly<MP>
//   ) => MarkovDecisionProcess<IS, S, A>["simulateFn"];
//   makeTransitionFn: (
//     factoryProps: Readonly<MP>
//   ) => MarkovDecisionProcess<IS, S, A>["transitionFn"];
// }

// export type MarkovDecisionProcessRepository<MP, FP, IS, S, A> = (
//   maker: MarkovDecisionProcessRepositoryMaker<MP, IS, S, A>
// ) => MarkovDecisionProcessFactory<FP, IS, S, A>;
