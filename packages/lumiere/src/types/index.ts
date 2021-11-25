//  S is the Strategy State
//  A is the action that the agent can take
//  O is the observation of the environment (aka the LuxSDK.GameState) = environment state
//  R is the reward
export type PolicyFn<S, A> = (state: S) => A; // π : State -> Action - From a state, it gives an action
export type ValueFn<S, A> = (state: S, action: A) => number; // v : Policy(state) -> Expected Reward - From a state or a Policy, it gives a reward
export type ModelFn<S> = ((state: S) => S) | ((state: S) => number); // m : State -> Action -> State or Reward - From a state, it *predicts* a state and/or a reward
export type SimulationFn<S, A> = (state: S, actions: A) => S; // s : State -> Action -> State - From a state and an action, it simulate a state.s

// Specific to the agent
export type UpdateFn<O, S, SP> = (state: S, observation: O) => SP; // u : State -> Observation -> Action? -> State - From a state (St) and observation (O), it gives a new state (St+1)

// Monte carlo search tree
// selection - expansion - simulation - backpropagation
// leaf -> node => no branch
// leaf -> possibiblity qui n'a pas ete explorer ou c'est la fin de la partie
// selection => NN va scorer les leafs
// choix vont etre font par Montecarlo
// prediction = score = (gamestate) => sum(worker.length) + sum(citytile.length)
// map score sort [leaf, leaf, leaf] according to prediction
// simulation => simuler jusqu'à la fin de la partie (en gardant ou pas les chemins) determiner qui à gagner => random
// backpropagation => inc visited

// 100 bot NN
// 100 genetic
// fitness = time s
// gym(100)
// %win NN
// pick les meilleurs => crossover
// gym => (population=100, () => MDP<NN>) => fitness => %win / sum(%sum)
// NN(bot) => qui gagne? X pas ça
// MDP<NN>

// filter | reduce S,A => S

export interface Environment<O> {
  observation: O;
}

export interface MarkovDecisionProcess<O, S, A> {
  getAction: Function;
  discount_factor: number;
  transitionProbaFn: (...args: any[]) => any; // compute the probability that action a in state s in time t will lead to state s'
  rewardFn: (...args: any[]) => any; // compute the immediate reward or the immediate reward after transitionning to state s'
}

// https://en.wikipedia.org/wiki/Partially_observable_Markov_decision_process
export interface PartiallyObservableMarkovDecisionProcess<O, S, SP, A>
  extends MarkovDecisionProcess<O, S, A> {
  updateFn: UpdateFn<O, S, SP>; // update our beliefs about the state
}
