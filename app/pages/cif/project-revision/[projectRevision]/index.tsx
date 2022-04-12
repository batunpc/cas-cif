import DefaultLayout from "components/Layout/DefaultLayout";
import { withRelay, RelayProps } from "relay-nextjs";
import { graphql, usePreloadedQuery } from "react-relay/hooks";
import { ProjectRevisionQuery } from "__generated__/ProjectRevisionQuery.graphql";
import withRelayOptions from "lib/relay/withRelayOptions";
import { useRouter } from "next/router";
import { Button } from "@button-inc/bcgov-theme";
import { mutation as updateProjectRevisionMutation } from "mutations/ProjectRevision/updateProjectRevision";
import { useDeleteProjectRevisionMutation } from "mutations/ProjectRevision/deleteProjectRevision";
import { createProjectSchema } from "components/Form/ProjectForm";

import { getProjectsPageRoute } from "pageRoutes";
import useRedirectTo404IfFalsy from "hooks/useRedirectTo404IfFalsy";
import TaskList from "components/TaskList";
import useMutationWithErrorMessage from "mutations/useMutationWithErrorMessage";

import FormBase from "components/Form/FormBase";

import readOnlyTheme from "lib/theme/ReadOnlyTheme";
import projectSchema from "data/jsonSchemaForm/projectSchema";
import { useMemo } from "react";
import { createProjectContactUiSchema } from "components/Form/ProjectContactForm";
import projectContactSchema from "data/jsonSchemaForm/projectContactSchema";
import projectManagerSchema from "data/jsonSchemaForm/projectManagerSchema";
import { createProjectManagerUiSchema } from "components/Form/ProjectManagerForm";

const pageQuery = graphql`
  query ProjectRevisionQuery($projectRevision: ID!) {
    query {
      session {
        ...DefaultLayout_session
      }
      projectRevision(id: $projectRevision) {
        id
        projectFormChange {
          newFormData
        }
        projectContactFormChanges {
          edges {
            node {
              newFormData
            }
          }
        }
        projectManagerFormChangesByLabel {
          edges {
            node {
              formChange {
                newFormData
              }
              projectManagerLabel {
                label
              }
            }
          }
        }
        ...TaskList_projectRevision
      }
      allContacts {
        edges {
          node {
            rowId
            id
            fullName
            familyName
            givenName
          }
        }
      }
      allCifUsers {
        edges {
          node {
            rowId
            id
            fullName
          }
        }
      }
      allFundingStreams {
        edges {
          node {
            id
            name
            rowId
          }
        }
      }
      allOperators {
        edges {
          node {
            rowId
            legalName
            tradeName
            bcRegistryId
          }
        }
      }
      allProjectStatuses {
        edges {
          node {
            name
            rowId
          }
        }
      }
    }
  }
`;

export function ProjectRevision({
  preloadedQuery,
}: RelayProps<{}, ProjectRevisionQuery>) {
  const router = useRouter();
  const { query } = usePreloadedQuery(pageQuery, preloadedQuery);

  const [updateProjectRevision, updatingProjectRevision] =
    useMutationWithErrorMessage(
      updateProjectRevisionMutation,
      () => "An error occurred while attempting to update the project revision."
    );
  const [discardProjectRevision, discardingProjectRevision] =
    useDeleteProjectRevisionMutation();

  let selectedOperator = useMemo(() => {
    return query.allOperators.edges.find(
      ({ node }) =>
        node.rowId ===
        query.projectRevision.projectFormChange.newFormData.operatorId
    );
  }, [query]);

  const rfpStream = useMemo(() => {
    return query.allFundingStreams.edges.find(
      ({ node }) =>
        node.rowId ===
        query.projectRevision.projectFormChange.newFormData.fundingStreamRfpId
    );
  }, [query]);

  const projectStatus = useMemo(() => {
    return query.allProjectStatuses.edges.find(
      ({ node }) =>
        node.rowId ===
        query.projectRevision.projectFormChange.newFormData.projectStatusId
    );
  }, [query]);

  const selectedContact = useMemo(() => {
    const selectedContactNode =
      query.projectRevision.projectContactFormChanges.edges.find(
        ({ node }) => node.newFormData.contactIndex === 1
      );

    return query.allContacts.edges.find(
      ({ node }) =>
        node.rowId === selectedContactNode.node.newFormData.contactId
    );
  }, [query]);

  // const techTeamPrimary = useMemo(() => {
  //   const techTeamPrimaryNode =
  //     query.projectRevision.projectManagerFormChangesByLabel.edges.find(
  //       ({ node }) => node.formChange.newFormData.projectManagerLabelId === 1
  //     );

  //   return query.allContacts.edges.find(
  //     ({ node }) =>
  //       node.rowId === techTeamPrimaryNode.node.formChange.newFormData.cifUserId
  //   );
  // }, [query]);

  console.log(
    "query.projectRevision.projectManagerFormChangesByLabel",
    query.projectRevision.projectManagerFormChangesByLabel
  );

  //don't need the usememo because no rerender
  const projectUiSchema = createProjectSchema(
    selectedOperator ? selectedOperator.node.tradeName : "",
    selectedOperator ? selectedOperator.node.legalName : "",
    selectedOperator ? selectedOperator.node.bcRegistryId : "",
    rfpStream ? rfpStream.node.name : "",
    projectStatus ? projectStatus.node.name : ""
  );

  const projectContactsUiSchema = createProjectContactUiSchema(
    selectedContact ? selectedContact.node.fullName : ""
  );

  // const projectManagerUiSchema = createProjectManagerUiSchema();

  const isRedirecting = useRedirectTo404IfFalsy(query.projectRevision);
  if (isRedirecting) return null;

  /**
   *  Function: approve staged change, trigger an insert on the project
   *  table & redirect to the project page
   */
  const commitProject = async () => {
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
      updater: (store) => {
        // Invalidate the entire store,to make sure that we don't display any stale data after redirecting to the next page.
        // This could be optimized to only invalidate the affected records.
        store.invalidateStore();
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

  // const contactIds = newContactFormData.map((el) => {
  //   return el.node.newFormData.contactId;
  // });

  // const managerIds = newProjectManagerFormData
  //   .map((el) => {
  //     if (el.node.formChange) {
  //       return el.node.formChange.newFormData.cifUserId;
  //     }
  //   })
  //   .filter((x) => x);

  // const makeJSX = (ids, all) => {
  //   const result = all
  //     .map((el) => {
  //       if (ids.includes(el.node.rowId)) {
  //         return (
  //           <p>
  //             {el.node.givenName} {el.node.familyName}
  //           </p>
  //         );
  //       }
  //     })
  //     .filter((x) => x);
  //   return result;
  // };

  // const primaryContact = newContactFormData.find(
  //   (contact) => contact.node.newFormData.contactIndex === 1
  // );

  // console.log("primaryContact", primaryContact);
  const taskList = <TaskList projectRevision={query.projectRevision} />;

  console.log(
    "contacts",
    "contactId" in
      query.projectRevision.projectContactFormChanges.edges[0].node.newFormData
  );
  return (
    <DefaultLayout session={query.session} leftSideNav={taskList}>
      <div>
        <header>
          <h2>Review and Submit Project</h2>
        </header>
        <h3>Project Overview</h3>
        {Object.keys(query.projectRevision.projectFormChange.newFormData)
          .length === 0 ? (
          "Project overview not added"
        ) : (
          <FormBase
            tagName={"dl"}
            theme={readOnlyTheme}
            schema={projectSchema}
            uiSchema={projectUiSchema}
            formData={query.projectRevision.projectFormChange.newFormData}
            formContext={{
              query,
              form: query.projectRevision.projectFormChange.newFormData,
            }}
          />
        )}

        <h3>Project Managers</h3>
        {!query.projectRevision.projectManagerFormChangesByLabel.edges[0].node
          .formChange
          ? "Project managers not added"
          : query.projectRevision.projectManagerFormChangesByLabel.edges.map(
              ({ node }) => {
                console.log("node is", node);
                console.log(
                  "query.projectRevision.projectManagerFormChangesByLabel.edges",
                  query.projectRevision.projectManagerFormChangesByLabel.edges
                );
                const selectedManager = query.allCifUsers.edges.find(
                  (manager) =>
                    manager.node.rowId === node.formChange.newFormData.cifUserId
                );

                return (
                  <FormBase
                    key={node.formChange.newFormData.cifUserId}
                    tagName={"dl"}
                    theme={readOnlyTheme}
                    schema={projectManagerSchema}
                    uiSchema={createProjectManagerUiSchema(
                      selectedManager.node.fullName,
                      node.projectManagerLabel.label
                    )}
                    formData={
                      query.projectRevision.projectManagerFormChangesByLabel
                    }
                    formContext={{
                      query,
                      form: query.projectRevision.projectFormChange.newFormData,
                    }}
                  />
                );
              }
            )}

        <h3>Project Contacts</h3>
        {"contactId" in
          query.projectRevision.projectContactFormChanges.edges[0].node
            .newFormData ===
        false ? (
          "Project contacts not added"
        ) : (
          <FormBase
            tagName={"dl"}
            theme={readOnlyTheme}
            schema={projectContactSchema}
            uiSchema={projectContactsUiSchema}
            formData={query.projectRevision.projectFormChange.newFormData}
            formContext={{
              query,
              form: query.projectRevision.projectContactFormChanges,
            }}
          />
        )}

        {/* <h2>Project Contacts</h2>
        {makeJSX(contactIds, query.allContacts.edges)}

        <h2>Project Managers</h2>
        {makeJSX(managerIds, query.allCifUsers.edges)} */}

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
      </div>
      <style jsx>{`
        div :global(.pg-button) {
          margin-right: 3em;
        }
        h3 {
          margin: 1em 0 0 0;
        }
      `}</style>
    </DefaultLayout>
  );
}

export default withRelay(ProjectRevision, pageQuery, withRelayOptions);
