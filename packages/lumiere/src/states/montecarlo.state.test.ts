import { createMonteCarloRootTree, MonteCarloTree } from "./montecarlo.state";

describe("Monte Carlo Tree", () => {
  let state: MonteCarloTree<any, any>;
  beforeEach(() => {
    state = createMonteCarloRootTree({});
  });

  it("should have created a state", () => {
    expect(state).toBeDefined();
  });
});
