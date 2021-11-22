import _ from "lodash";
import {
  createMonteCarloTree,
  getOutComes,
  MonteCarloTree,
  pickRandomWeightedOutcomeBranch,
} from "../states/montecarlo.state";
import {
  createMonteCarloProcessRepository,
  MonteCarloProcessRepository,
  MonteCarloProcessRepositoryDependencies,
} from "./montecarlo.process";
import { createMCTSRepository } from "../algorithm/MCTS.algorithm";

describe("Monte Carlo Test", () => {
  describe("Rock paper scissors game", () => {
    const possibleActions = ["rock", "paper", "scissors"] as const;
    type TAction = typeof possibleActions[number];
    type TObservation = {
      turn: number;
      score: { agent: number; opponent: number };
    };
    const opponent: Record<TAction, number> = {
      rock: 0.8, // 80%
      paper: 0.1, // 10%
      scissors: 0.1, // 10%
    };
    const opponentPickAction = (): TAction => {
      const s = _.sum(Object.values(opponent));
      const probabilities = Object.entries(opponent) as [TAction, number][];
      const random = Math.random() * s;
      let current = 0;
      for (const [action, probability] of probabilities) {
        current += probability;
        if (current > random) {
          return action;
        }
      }
      return probabilities[0][0];
    };

    class RockPaperScissorsGameEngine implements TObservation {
      private constructor(
        public turn: number,
        public score: { agent: number; opponent: number }
      ) {}

      static create({
        turn = 0,
        score = { agent: 0, opponent: 0 },
      }: Partial<TObservation>) {
        return new RockPaperScissorsGameEngine(turn, score);
      }

      static isEnd(state: RockPaperScissorsGameEngine) {
        return state.turn >= 5;
      }

      static update(
        gameState: RockPaperScissorsGameEngine,
        agentAction: TAction,
        opponentAction: TAction
      ): TObservation {
        if (agentAction === opponentAction)
          return RockPaperScissorsGameEngine.create({
            turn: gameState.turn + 1,
            score: {
              agent: gameState.score.agent,
              opponent: gameState.score.opponent,
            },
          });
        if (agentAction === "rock" && opponentAction === "scissors")
          return RockPaperScissorsGameEngine.create({
            turn: gameState.turn + 1,
            score: {
              agent: gameState.score.agent + 1,
              opponent: gameState.score.opponent,
            },
          });
        if (agentAction === "paper" && opponentAction === "rock")
          return RockPaperScissorsGameEngine.create({
            turn: gameState.turn + 1,
            score: {
              agent: gameState.score.agent + 1,
              opponent: gameState.score.opponent,
            },
          });

        if (agentAction === "scissors" && opponentAction === "paper")
          return RockPaperScissorsGameEngine.create({
            turn: gameState.turn + 1,
            score: {
              agent: gameState.score.agent + 1,
              opponent: gameState.score.opponent,
            },
          });
        return RockPaperScissorsGameEngine.create({
          turn: gameState.turn + 1,
          score: {
            agent: gameState.score.agent,
            opponent: gameState.score.opponent + 1,
          },
        });
      }
    }

    class Agent<S> {
      gameEngine = RockPaperScissorsGameEngine.create({});

      constructor(public state: S) {}

      run(
        callback: (
          gameState: RockPaperScissorsGameEngine,
          formerState: S
        ) => [TAction, any]
      ) {
        while (!RockPaperScissorsGameEngine.isEnd(this.gameEngine)) {
          const [action, newState] = callback(this.gameEngine, this.state);
          RockPaperScissorsGameEngine.update(
            this.gameEngine,
            action,
            opponentPickAction()
          );
          this.state = newState;
        }
      }
    }

    const rewardFn: MonteCarloProcessRepositoryDependencies<
      RockPaperScissorsGameEngine,
      TAction
    >["rewardFn"] = (state) => {
      if (state.observation.score.agent === state.observation.score.opponent)
        return 0;
      return state.observation.score.agent > state.observation.score.opponent
        ? 1
        : -1;
    };
    const getKeyFromAction: MonteCarloProcessRepositoryDependencies<
      RockPaperScissorsGameEngine,
      TAction
    >["getKeyFromAction"] = (action) => action;
    const getActionFromKey: MonteCarloProcessRepositoryDependencies<
      RockPaperScissorsGameEngine,
      TAction
    >["getActionFromKey"] = (key) => key as TAction;
    const getAction: MonteCarloProcessRepositoryDependencies<
      RockPaperScissorsGameEngine,
      TAction
    >["getAction"] = () => possibleActions.map((action) => action);
    const simulate: MonteCarloProcessRepositoryDependencies<
      RockPaperScissorsGameEngine,
      TAction
    >["simulate"] = {
      state: (state, agentAction, opponentAction) =>
        createMonteCarloTree(
          RockPaperScissorsGameEngine.update(
            state.observation,
            agentAction,
            opponentAction
          )
        ),
      agentActions: () => possibleActions.map((action) => action),
      opponentActions: () => possibleActions.map((action) => action),
    };
    const model: MonteCarloProcessRepositoryDependencies<
      RockPaperScissorsGameEngine,
      TAction
    >["model"] = {
      policy: (state) => rewardFn(state),
      value: (state) => 0.5,
    };
    const isTerminalState: MonteCarloProcessRepositoryDependencies<
      RockPaperScissorsGameEngine,
      TAction
    >["isTerminalState"] = (state) =>
      RockPaperScissorsGameEngine.isEnd(state.observation);
    const transitionProbaFn: MonteCarloProcessRepositoryDependencies<
      RockPaperScissorsGameEngine,
      TAction
    >["transitionProbaFn"] = (
      startState,
      agentAction,
      opponentAction,
      allEndStates
    ) => {
      const ret = opponent[opponentAction];
      return ret;
    };

    let repository: MonteCarloProcessRepository<
      RockPaperScissorsGameEngine,
      TAction
    >;
    let agentState: MonteCarloTree<RockPaperScissorsGameEngine>;
    let agent: Agent<MonteCarloTree<RockPaperScissorsGameEngine>>;

    describe("simple agent state", () => {
      const createSimpleState = () => {
        const repository = createMonteCarloProcessRepository<
          RockPaperScissorsGameEngine,
          TAction
        >({
          rewardFn,
          getKeyFromAction,
          getActionFromKey,
          getAction,
          simulate,
          model,
          isTerminalState,
          transitionProbaFn,
        });
        const agentState = repository.tree.createRoot(
          RockPaperScissorsGameEngine.create({})
        );
        const agent = new Agent(agentState);

        return {
          repository,
          agentState,
          agent,
        };
      };

      beforeEach(() => {
        const simpleState = createSimpleState();
        repository = simpleState.repository;
        agentState = simpleState.agentState;
        agent = simpleState.agent;
      });

      it("should be turn 0", () => {
        expect(agentState.observation.turn).toBe(0);
      });

      it("should declare the state as expandable", () => {
        expect(repository.isExpandable(agent.state)).toBe(true);
      });

      describe("Repository", () => {
        describe("simulate", () => {
          describe("state", () => {
            let simulatedState: MonteCarloTree<RockPaperScissorsGameEngine>;
            describe("simulate (agent) rock vs (opponent) rock", () => {
              beforeEach(() => {
                const simpleState = createSimpleState();
                repository = simpleState.repository;
                agentState = simpleState.agentState;
                agent = simpleState.agent;
                simulatedState = repository.simulate.state(
                  agentState,
                  "rock",
                  "rock"
                );
              });

              it("it should have increase the turn count by 1", () => {
                expect(simulatedState.observation.turn).toBe(
                  agentState.observation.turn + 1
                );
              });
              it("should score 0 for the agent and 0 for the opponent", () => {
                expect(simulatedState.observation.score.agent).toBe(0);
                expect(simulatedState.observation.score.opponent).toBe(0);
              });
            });

            describe("simulate (agent) scissors vs (opponent) rock", () => {
              beforeEach(() => {
                const simpleState = createSimpleState();
                repository = simpleState.repository;
                agentState = simpleState.agentState;
                agent = simpleState.agent;
                simulatedState = repository.simulate.state(
                  agentState,
                  "scissors",
                  "rock"
                );
              });

              it("it should have increase the turn count by 1", () => {
                expect(simulatedState.observation.turn).toBe(
                  agentState.observation.turn + 1
                );
              });
              it("should score 0 for the agent and 1 for the opponent", () => {
                expect(simulatedState.observation.score.agent).toBe(0);
                expect(simulatedState.observation.score.opponent).toBe(1);
              });
            });

            describe("simulate (agent) scissors vs (opponent) paper", () => {
              beforeEach(() => {
                const simpleState = createSimpleState();
                repository = simpleState.repository;
                agentState = simpleState.agentState;
                agent = simpleState.agent;
                simulatedState = repository.simulate.state(
                  agentState,
                  "scissors",
                  "paper"
                );
              });

              it("it should have increase the turn count by 1", () => {
                expect(simulatedState.observation.turn).toBe(
                  agentState.observation.turn + 1
                );
              });
              it("should score 1 for the agent and 0 for the opponent", () => {
                expect(simulatedState.observation.score.agent).toBe(1);
                expect(simulatedState.observation.score.opponent).toBe(0);
              });
            });
          });
        });

        describe("valueFn", () => {
          beforeEach(() => {
            const simpleState = createSimpleState();
            repository = simpleState.repository;
            agentState = simpleState.agentState;
            agent = simpleState.agent;
          });

          it("should not return NaN", () => {
            expect(repository.valueFn(agentState)).not.toBeNaN();
          });
        });
      });

      describe("Monte carlo Search Tree", () => {
        describe("Selection", () => {
          beforeEach(() => {
            const simpleState = createSimpleState();
            repository = simpleState.repository;
            agentState = simpleState.agentState;
            agent = simpleState.agent;
          });

          it("should select the root as the selected node", () => {
            expect(repository.mcts.selection(agent.state)).toBe(agent.state);
          });
        });

        describe("Expansion", () => {
          let expandedState: MonteCarloTree<RockPaperScissorsGameEngine>;
          beforeEach(() => {
            const simpleState = createSimpleState();
            repository = simpleState.repository;
            agentState = simpleState.agentState;
            agent = simpleState.agent;
            expandedState = repository.mcts.expansion(agent.state);
          });

          it("should have created 3 branches", () => {
            expect(Object.values(expandedState.branches).length).toBe(3);
          });

          it("should have created a 'rock', 'paper' and 'scissors' branch", () => {
            expect(expandedState.branches.rock).toBeDefined();
            expect(expandedState.branches.paper).toBeDefined();
            expect(expandedState.branches.scissors).toBeDefined();
          });
        });
      });
    });

    describe("End game state", () => {
      const createEndGameState = () => {
        const repository = createMonteCarloProcessRepository<
          RockPaperScissorsGameEngine,
          TAction
        >({
          rewardFn,
          getKeyFromAction,
          getActionFromKey,
          getAction,
          simulate,
          model,
          isTerminalState,
          transitionProbaFn,
        });
        const agentState = repository.tree.createRoot(
          RockPaperScissorsGameEngine.create({
            turn: 5,
            score: { agent: 3, opponent: 2 },
          })
        );
        const agent = new Agent(agentState);

        return {
          repository,
          agentState,
          agent,
        };
      };

      beforeEach(() => {
        const endGameState = createEndGameState();
        repository = endGameState.repository;
        agentState = endGameState.agentState;
        agent = endGameState.agent;
      });

      it("should be the 5th turn", () => {
        expect(agentState.observation.turn).toBe(5);
      });

      it("should return the same as the input dependency", () => {
        expect(repository.isTerminalState(agentState)).toBe(
          isTerminalState(agentState)
        );
      });

      it("should be an end state/terminal state", () => {
        expect(repository.isTerminalState(agentState)).toBe(true);
      });

      it("should give the agent a reward of 1", () => {
        expect(repository.rewardFn(agentState)).toBe(1);
      });
    });

    describe("Last Turn Game State", () => {
      const createLastTurnState = () => {
        const repository = createMonteCarloProcessRepository<
          RockPaperScissorsGameEngine,
          TAction
        >({
          rewardFn,
          getKeyFromAction,
          getActionFromKey,
          getAction,
          simulate,
          model,
          isTerminalState,
          transitionProbaFn,
        });
        const agentState = repository.tree.createRoot(
          RockPaperScissorsGameEngine.create({
            turn: 4,
            score: { agent: 2, opponent: 2 },
          })
        );
        const agent = new Agent(agentState);

        return {
          repository,
          agentState,
          agent,
        };
      };

      beforeEach(() => {
        const LastTurnState = createLastTurnState();
        repository = LastTurnState.repository;
        agentState = LastTurnState.agentState;
        agent = LastTurnState.agent;
        agentState = repository.mcts.expansion(agent.state);
      });

      it("should be the 4th turn", () => {
        expect(agentState.observation.turn).toBe(4);
      });

      it("should not be the end game state", () => {
        expect(repository.isTerminalState(agentState)).toBe(false);
      });

      it("should not give the agent a reward", () => {
        expect(repository.rewardFn(agentState)).toBe(0);
      });

      describe("Monte carlo Search Tree", () => {
        describe("Simulation", () => {
          beforeEach(() => {
            const LastTurnState = createLastTurnState();
            repository = LastTurnState.repository;
            agentState = LastTurnState.agentState;
            agent = LastTurnState.agent;
            agentState = repository.mcts.expansion(agent.state);
          });

          it("should simulate", () => {
            const simulatedState = repository.mcts.simulation(agentState);
            expect(simulatedState).toBeDefined();
          });

          it("should be able to simulate 3 times", () => {
            const simulatedState = repository.mcts.simulation(agentState);
            expect(simulatedState).toBeDefined();
            const simulatedState2 = repository.mcts.simulation(agentState);
            expect(simulatedState2).toBeDefined();
            const simulatedState3 = repository.mcts.simulation(agentState);
            expect(simulatedState3).toBeDefined();
          });
        });
      });
    });

    describe("3th Game State", () => {
      const create3thState = () => {
        const repository = createMonteCarloProcessRepository<
          RockPaperScissorsGameEngine,
          TAction
        >({
          rewardFn,
          getKeyFromAction,
          getActionFromKey,
          getAction,
          simulate,
          model,
          isTerminalState,
          transitionProbaFn,
        });
        const agentState = repository.tree.createRoot(
          RockPaperScissorsGameEngine.create({
            turn: 3,
            score: { agent: 1, opponent: 2 },
          })
        );
        const agent = new Agent(agentState);

        return {
          repository,
          agentState,
          agent,
        };
      };

      beforeEach(() => {
        const state = create3thState();
        repository = state.repository;
        agentState = state.agentState;
        agent = state.agent;
      });

      it("should be the 3rd turn", () => {
        expect(agentState.observation.turn).toBe(3);
      });

      describe("Monte carlo Search Tree", () => {
        describe("Simulation", () => {
          beforeEach(() => {
            const LastTurnState = create3thState();
            repository = LastTurnState.repository;
            agentState = LastTurnState.agentState;
            agent = LastTurnState.agent;
            agentState = repository.mcts.expansion(agent.state);
          });

          it.only("should simulate", () => {
            const simulatedState = repository.mcts.simulation(agentState);
            expect(simulatedState).toBeDefined();
          });
        });
      });
    });
  });
});
