import _ from "lodash/fp";
import {
  ExpandedMonteCarloTree,
  MonteCarloTree,
} from "../states/montecarlo.state";
import {
  Agent,
  RockPaperScissorsGameEngine,
  RPSAction,
  rewardFn,
  getKeyFromAction,
  getActionFromKey,
  getAction,
  simulate,
  model,
  isTerminalState,
  transitionProbaFn,
} from "../utils/test/RockPaperScissors.game";
import {
  createMonteCarloProcessRepository,
  MonteCarloProcessRepository,
} from "./montecarlo.process";

describe("Monte Carlo Test", () => {
  describe("Rock paper scissors game", () => {
    let repository: MonteCarloProcessRepository<
      RockPaperScissorsGameEngine,
      RPSAction
    >;
    let agentState: MonteCarloTree<RockPaperScissorsGameEngine, RPSAction>;
    let agent: Agent<MonteCarloTree<RockPaperScissorsGameEngine, RPSAction>>;

    describe("simple agent state", () => {
      const createSimpleState = () => {
        const repository = createMonteCarloProcessRepository<
          RockPaperScissorsGameEngine,
          RPSAction
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
            let simulatedState: MonteCarloTree<
              RockPaperScissorsGameEngine,
              RPSAction
            >;
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
            expect(repository.valueFn(agentState, "rock")).not.toBeNaN();
            expect(repository.valueFn(agentState, "paper")).not.toBeNaN();
            expect(repository.valueFn(agentState, "scissors")).not.toBeNaN();
          });
        });
      });

      describe("Monte carlo Search Tree", () => {
        describe("Expansion", () => {
          let expandedState: ExpandedMonteCarloTree<
            RockPaperScissorsGameEngine,
            RPSAction
          >;
          beforeEach(() => {
            const simpleState = createSimpleState();
            repository = simpleState.repository;
            agentState = simpleState.agentState;
            agent = simpleState.agent;
            expandedState = repository.mcts.expansion(agent.state);
          });

          it("should have created 3 branches", () => {
            expect(
              Object.values(expandedState.edges.getOutcomesByAgentAction())
                .length
            ).toBe(3);
          });

          it("should have created a 'rock', 'paper' and 'scissors' branch", () => {
            expect(
              expandedState.edges.getOutcomesByAgentAction().rock
            ).toBeDefined();
            expect(
              expandedState.edges.getOutcomesByAgentAction().paper
            ).toBeDefined();
            expect(
              expandedState.edges.getOutcomesByAgentAction().scissors
            ).toBeDefined();
          });

          it("should be an in-place mutation", () => {
            expect(agentState).toBe(expandedState);
            expect(
              Object.values(expandedState.edges.getOutcomesByAgentAction())
                .length
            ).toBe(3);
          });
        });
      });
    });

    describe("End game state", () => {
      const createEndGameState = () => {
        const repository = createMonteCarloProcessRepository<
          RockPaperScissorsGameEngine,
          RPSAction
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
          RPSAction
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
        const lastTurnState = createLastTurnState();
        repository = lastTurnState.repository;
        agentState = lastTurnState.agentState;
        agent = lastTurnState.agent;
        agentState = repository.mcts.expansion(agent.state);
      });

      it("should be the 4th turn", () => {
        expect(agentState.observation.turn).toBe(4);
      });

      it("should not be the end game state", () => {
        expect(repository.isTerminalState(agentState)).toBe(false);
      });

      it("should not give the agent a reward", () => {
        expect(repository.rewardFn(agentState)).toBe(0.5);
      });

      describe("Monte carlo Search Tree", () => {
        describe("Simulation", () => {
          let simulatedState: MonteCarloTree<
            RockPaperScissorsGameEngine,
            RPSAction
          >;
          beforeEach(() => {
            const LastTurnState = createLastTurnState();
            repository = LastTurnState.repository;
            agentState = LastTurnState.agentState;
            agent = LastTurnState.agent;
            agentState = repository.mcts.expansion(agent.state);
            simulatedState = repository.mcts.simulation(agentState);
          });

          it("should simulate", () => {
            expect(simulatedState).toBeDefined();
          });
        });

        describe("Backpropagation", () => {
          let simulatedState: MonteCarloTree<
            RockPaperScissorsGameEngine,
            RPSAction
          >;
          let backpropagetedState: MonteCarloTree<
            RockPaperScissorsGameEngine,
            RPSAction
          >;
          beforeEach(() => {
            const LastTurnState = createLastTurnState();
            repository = LastTurnState.repository;
            agentState = LastTurnState.agentState;
            agent = LastTurnState.agent;
            agentState = repository.mcts.expansion(agent.state);
            simulatedState = repository.mcts.simulation(agentState);
            backpropagetedState = repository.mcts.backpropagation(
              agentState,
              simulatedState
            );
          });

          it("should have increase the visit count", () => {
            expect(backpropagetedState.visited).toBe(
              createLastTurnState().agentState.visited + 1
            );
          });

          it("should have backpropate the result of the simulated game", () => {
            expect(backpropagetedState.win).toBe(
              createLastTurnState().agentState.win +
                repository.rewardFn(simulatedState)
            );
          });
        });
      });

      describe("Markov Decision Process", () => {
        let terminalState: MonteCarloTree<
          RockPaperScissorsGameEngine,
          RPSAction
        >;
        let decidedActionToTake: RPSAction;
        beforeEach(() => {
          const LastTurnState = createLastTurnState();
          repository = LastTurnState.repository;
          agentState = LastTurnState.agentState;
          agent = LastTurnState.agent;
          const expandedState = repository.mcts.expansion(agent.state);
          console.log("expandedState", expandedState);
          terminalState = repository.plan(expandedState);
          decidedActionToTake = repository.decide(expandedState);
        });

        it("should have return a terminal State", () => {
          expect(terminalState).toBeDefined();
        });

        it("should have expand the state", () => {
          const outcomeByAgentAction =
            agentState.edges?.getOutcomesByAgentAction();
          if (!outcomeByAgentAction) fail("agentState should have edges");
          expect(Object.keys(outcomeByAgentAction).length).toBe(3);
          expect(outcomeByAgentAction.rock).toBeDefined();
          expect(outcomeByAgentAction.paper).toBeDefined();
          expect(outcomeByAgentAction.scissors).toBeDefined();
        });

        it("should have take a decision", () => {
          expect(decidedActionToTake).toBeDefined();
        });
      });
    });

    describe("3th turn Game State", () => {
      const create3thState = () => {
        const repository = createMonteCarloProcessRepository<
          RockPaperScissorsGameEngine,
          RPSAction
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
          let simulatedState: MonteCarloTree<
            RockPaperScissorsGameEngine,
            RPSAction
          >;
          beforeEach(() => {
            const thirdTurnState = create3thState();
            repository = thirdTurnState.repository;
            agentState = thirdTurnState.agentState;
            agent = thirdTurnState.agent;
            agentState = repository.mcts.expansion(agent.state);
            simulatedState = repository.mcts.simulation(agentState);
          });

          it("should simulate", () => {
            expect(simulatedState).toBeDefined();
          });
        });
      });
    });

    describe("simple state that play only paper", () => {
      const createSimpleState = () => {
        const repository = createMonteCarloProcessRepository<
          RockPaperScissorsGameEngine,
          RPSAction
        >({
          rewardFn,
          getKeyFromAction,
          getActionFromKey,
          getAction,
          simulate,
          model,
          isTerminalState,
          transitionProbaFn,
          policyFn: () => "paper",
        });
        const agentState = repository.tree.createRoot(
          RockPaperScissorsGameEngine.create({
            turn: 0,
            score: { agent: 0, opponent: 0 },
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
        const simpleRPS = createSimpleState();
        repository = simpleRPS.repository;
        agentState = simpleRPS.agentState;
        agent = simpleRPS.agent;
      });

      it("should play paper", () => {
        const expandedState = repository.mcts.expansion(agent.state);
        expect(repository.policyFn(expandedState)).toBe("paper");
      });
    });
  });
});
