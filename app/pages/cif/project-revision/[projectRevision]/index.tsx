import DefaultLayout from "components/Layout/DefaultLayout";
import { withRelay, RelayProps } from "relay-nextjs";
import { graphql, usePreloadedQuery } from "react-relay/hooks";
import { ProjectRevisionQuery } from "__generated__/ProjectRevisionQuery.graphql";
import withRelayOptions from "lib/relay/withRelayOptions";
import { mutation } from "mutations/FormChange/updateFormChange";
import { useRouter } from "next/router";
import { Button } from "@button-inc/bcgov-theme";
import Grid from "@button-inc/bcgov-theme/Grid";
import { useMemo, useRef } from "react";
import useDebouncedMutation from "mutations/useDebouncedMutation";
import SavingIndicator from "components/Form/SavingIndicator";
import ProjecManagerFormGroup from "components/Form/ProjectManagerFormGroup";
import ProjectForm from "components/Form/ProjectForm";
import { mutation as updateProjectRevisionMutation } from "mutations/ProjectRevision/updateProjectRevision";
import { useDeleteProjectRevisionMutation } from "mutations/ProjectRevision/deleteProjectRevision";
import { useMutation } from "react-relay";
import { getProjectsPageRoute } from "pageRoutes";
import ProjectContactForm from "components/Form/ProjectContactForm";
import { ISupportExternalValidation } from "components/Form/Interfaces/FormValidationTypes";
import validateFormWithErrors from "lib/helpers/validateFormWithErrors";

const pageQuery = graphql`
  query ProjectRevisionQuery($projectRevision: ID!) {
    query {
      session {
        ...DefaultLayout_session
      }
      projectRevision(id: $projectRevision) {
        id
        updatedAt
        projectFormChange {
          id
          newFormData
        }
        ...ProjectManagerFormGroup_revision
      }
      ...ProjectForm_query
      ...ProjectManagerFormGroup_query
      ...ProjectContactForm_query
    }
  }
`;

export function ProjectRevision({
  preloadedQuery,
}: RelayProps<{}, ProjectRevisionQuery>) {
  const projectFormRef = useRef(null);
  const projectManagerFormRef = useRef<ISupportExternalValidation>(null);
  const projectContactFormRef = useRef<ISupportExternalValidation>(null);

  const router = useRouter();
  const { query } = usePreloadedQuery(pageQuery, preloadedQuery);

  const [updateFormChange, updatingFormChange] = useDebouncedMutation(mutation);
  const [updateProjectRevision, updatingProjectRevision] = useMutation(
    updateProjectRevisionMutation
  );
  const [discardProjectRevision, discardingProjectRevision] =
    useDeleteProjectRevisionMutation();

  const lastEditedDate = useMemo(
    () => new Date(query.projectRevision.updatedAt),
    [query.projectRevision.updatedAt]
  );

  if (!query.projectRevision.id) return null;

  const handleChange = (queriedFormChange: any, changeObject: any) => {
    const updatedFormData = {
      ...queriedFormChange.newFormData,
      ...changeObject,
    };
    return updateFormChange({
      variables: {
        input: {
          id: queriedFormChange.id,
          formChangePatch: {
            newFormData: updatedFormData,
          },
        },
      },
      optimisticResponse: {
        updateFormChange: {
          formChange: {
            id: queriedFormChange.id,
            newFormData: updatedFormData,
          },
        },
      },
      debounceKey: queriedFormChange.id,
    });
  };

  /**
   *  Function: approve staged change, trigger an insert on the project
   *  table & redirect to the project page
   */
  const commitProject = async () => {
    const errors = [
      ...validateFormWithErrors(projectFormRef.current),
      ...projectManagerFormRef.current.selfValidate(),
      ...projectContactFormRef.current.selfValidate(),
    ];

    if (errors.length > 0) {
      console.log("Could not submit a form with errors: ", errors);
      return;
    }

    updateProjectRevision({
      variables: {
        input: {
          id: query.projectRevision.id,
          projectRevisionPatch: { changeStatus: "committed" },
        },
      },
      // No need for an optimistic response
      // Since we navigate away from the page after the mutation is complete
      onCompleted: async () => {
        await router.push(getProjectsPageRoute());
      },
    });
  };

  const discardRevision = async () => {
    await discardProjectRevision({
      variables: {
        input: {
          id: query.projectRevision.id,
        },
      },
      onCompleted: async () => {
        await router.push(getProjectsPageRoute());
      },
      onError: async (e) => {
        console.error("Error discarding the project", e);
      },
    });
  };

  return (
    <DefaultLayout session={query.session} title="CIF Projects Management">
      <header>
        <h2>Project Overview</h2>
        <SavingIndicator
          isSaved={
            !updatingFormChange &&
            !updatingProjectRevision &&
            !discardingProjectRevision
          }
          lastEdited={lastEditedDate}
        />
      </header>
      <Grid cols={2}>
        <Grid.Row gutter={[20, 0]}>
          <Grid.Col>
            <ProjectForm
              ref={projectFormRef}
              query={query}
              formData={query.projectRevision.projectFormChange.newFormData}
              onChange={(change) =>
                handleChange(
                  query.projectRevision.projectFormChange,
                  change.formData
                )
              }
            />
          </Grid.Col>
          <Grid.Col>
            <ProjecManagerFormGroup
              query={query}
              revision={query.projectRevision}
              projectManagerFormRef={projectManagerFormRef}
              setValidatingForm={(validator) =>
                (projectManagerFormRef.current = validator)
              }
            />
            <ProjectContactForm
              query={query}
              setValidatingForm={(validator) =>
                (projectContactFormRef.current = validator)
              }
            />
          </Grid.Col>
        </Grid.Row>
        <Grid.Row>
          <Button
            size="medium"
            variant="primary"
            onClick={commitProject}
            disabled={updatingProjectRevision || discardingProjectRevision}
          >
            Submit
          </Button>
          <Button
            size="medium"
            variant="secondary"
            onClick={discardRevision}
            disabled={updatingProjectRevision || discardingProjectRevision}
          >
            Discard Changes
          </Button>
          <Button size="medium" variant="secondary">
            Return to Project List
          </Button>
        </Grid.Row>
      </Grid>
      <style jsx>{`
        header {
          display: flex;
          justify-content: space-between;
          align-items: start;
        }

        :global(.pg-button) {
          margin-right: 3em;
        }
      `}</style>
    </DefaultLayout>
  );
}

export default withRelay(ProjectRevision, pageQuery, withRelayOptions);
