// Neuro--evolution
// Algo genetic / NN

// 100 bots => battle => calculate fitness => select bots couple => crossover => mutate (%taux de mutation)

// bot => 4 choix => 4 states => evaluer (value network) => policy network (greedy) => decide
// 3 x 3 0x0 3x3 [0x0, 0x1, 0x2,  0x1, ..., 3x3]
// backpropagation => rewards = 50 - steps 10  steps 9 50-9
// evaluate(4 states) => score
// value: distance to the goal
/// policy : (exploratiion | exploitation) => rewards

// bot => 4 choix => 4 states => evaluer (value network) = NN => taux de reussite => anticipation du rewards => policy network (greedy, e-greedy (20% random)) => decide
// states.map(state => value(state))

//  GOAL =  avoir  le plus  de tiles que l'ennemie
// random choices  => tu as gagne ou tu as perdu

// computeAllPossibleAction(gameState) => action[]
// simulateNextTurn(gameState, actions) => GameState
// strategy(policy, value, state, {}) => action[]
// Neuro-Evolution  => gym(factory: () =>  NN, population: number, mutate_rate:  number)
//  selection => reproduction
// => return  meilleur individu

// A | B = C
// C est combination des neuronnes de A et B
// une fois que les neuronnes ont été reçu, on les mutates 10% de chances
//  mutate() => full random / loi normal

// Automate | Intelligence
