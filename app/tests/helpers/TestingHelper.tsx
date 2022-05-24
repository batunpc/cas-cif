import { act } from "@testing-library/react";
import { NextRouter } from "next/router";
import { createMockEnvironment, RelayMockEnvironment } from "relay-test-utils";
import { createMockRouter } from "./mockNextRouter";

class TestingHelper {
  public errorContext: {
    error: any;
    setError: any;
  };

  public environment: RelayMockEnvironment;

  public router: NextRouter;

  public reinit() {
    this.environment = createMockEnvironment();
    this.errorContext = {
      error: null,
      setError: jest.fn().mockImplementation((error) =>
        act(() => {
          this.errorContext.error = error;
        })
      ),
    };
    this.router = createMockRouter();
  }

  public expectMutationToBeCalled(mutationName: string, variables?: any) {
    // eslint-disable-next-line jest/no-standalone-expect
    expect(this.environment.mock.getAllOperations()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fragment: expect.objectContaining({
            node: expect.objectContaining({
              type: "Mutation",
              name: mutationName,
            }),
          }),
          request: expect.objectContaining({
            variables,
          }),
        }),
      ])
    );
  }
}

export default TestingHelper;
