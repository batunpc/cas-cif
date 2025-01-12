import useMutationWithErrorMessage from "mutations/useMutationWithErrorMessage";
import { graphql } from "react-relay";
import { discardAdditionalFundingSourceFormChangeMutation } from "__generated__/discardAdditionalFundingSourceFormChangeMutation.graphql";

const discardMutation = graphql`
  mutation discardAdditionalFundingSourceFormChangeMutation(
    $input: DiscardAdditionalFundingSourceFormChangeInput!
  ) {
    discardAdditionalFundingSourceFormChange(input: $input) {
      projectRevision {
        ...TaskList_projectRevision
        ...ProjectFundingAgreementForm_projectRevision
      }
    }
  }
`;

const useDiscardAdditionalFundingSourceFormChange = () =>
  useMutationWithErrorMessage<discardAdditionalFundingSourceFormChangeMutation>(
    discardMutation,
    () => "An error occurred when deleting additional funding source form."
  );

export default useDiscardAdditionalFundingSourceFormChange;
