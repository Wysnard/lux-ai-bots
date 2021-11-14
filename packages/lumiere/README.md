# Lumière

Lumière is a collection of Reinforcement Learning algorithm for Lux-AI

## What is a Policy ?

We define policy in terms of Markov Decision Process

```typescript
type policy = (
  currentState: S, // the current GameState
  availableActions: A, // the actions available
  transition: T, // transition function which represents the probability to end up in the endState by taking the actionsTaken knowing that we were in the startingState
  reward: R // a determitic reward function
) => A[]; // actions taken
```

# Ressources

https://www.baeldung.com/cs/ml-policy-reinforcement-learning
https://en.wikipedia.org/wiki/Markov_decision_process
