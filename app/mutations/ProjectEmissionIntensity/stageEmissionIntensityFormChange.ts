import useMutationWithErrorMessage from "mutations/useMutationWithErrorMessage";
import { graphql } from "react-relay";
import { stageEmissionIntensityFormChangeMutation } from "__generated__/stageEmissionIntensityFormChangeMutation.graphql";

const mutation = graphql`
  mutation stageEmissionIntensityFormChangeMutation(
    $input: StageFormChangeInput!
  ) {
    stageFormChange(input: $input) {
      formChange {
        id
        asEmissionIntensityReport {
          calculatedEiPerformance
        }
        newFormData
        operation
        changeStatus
        projectRevisionByProjectRevisionId {
          teimpPaymentPercentage
          teimpPaymentAmount
          ...TaskList_projectRevision
        }
      }
    }
  }
`;

export const useStageEmissionIntensityFormChange = () => {
  return useMutationWithErrorMessage<stageEmissionIntensityFormChangeMutation>(
    mutation,
    () => "An error occurred when staging the form change."
  );
};
