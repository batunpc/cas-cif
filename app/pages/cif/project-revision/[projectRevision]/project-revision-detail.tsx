import withRelayOptions from "lib/relay/withRelayOptions";
import { RelayProps, withRelay } from "relay-nextjs";
import { graphql, usePreloadedQuery } from "react-relay/hooks";
import DefaultLayout from "components/Layout/DefaultLayout";
import TaskList from "components/TaskList";
import { projectRevisionDetailQuery } from "app/__generated__/projectRevisionDetailQuery.graphql";
import FormBase from "components/Form/FormBase";
import {
  projectRevisionSchema,
  projectRevisionUISchema,
} from "data/jsonSchemaForm/projectRevisionSchema";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import EmptyObjectFieldTemplate from "lib/theme/EmptyObjectFieldTemplate";
import readOnlyTheme from "lib/theme/ReadOnlyTheme";
import { getLocaleFormattedDate } from "lib/theme/getLocaleFormattedDate";

const createProjectRevisionDetailSchema = (allRevisionTypes) => {
  const schema = projectRevisionSchema;
  schema.properties.revisionType = {
    ...schema.properties.revisionType,
    anyOf: allRevisionTypes.edges.map(({ node }) => {
      return {
        type: "string",
        title: node.type,
        enum: [node.type],
        value: node.type,
      } as JSONSchema7Definition;
    }),
  };

  return schema as JSONSchema7;
};

const createProjectRevisionUISchema = () => {
  const uiSchema = projectRevisionUISchema;
  uiSchema.revisionType["ui:readonly"] = true;
  return uiSchema;
};

export const ProjectRevisionDetailQuery = graphql`
  query projectRevisionDetailQuery($projectRevision: ID!) {
    session {
      ...DefaultLayout_session
    }
    projectRevision(id: $projectRevision) {
      id
      revisionType
      createdAt
      cifUserByCreatedBy {
        fullName
      }
      updatedAt
      cifUserByUpdatedBy {
        fullName
      }
      projectByProjectId {
        latestCommittedProjectRevision {
          ...TaskList_projectRevision
        }
      }
    }
    allRevisionTypes {
      edges {
        node {
          type
        }
      }
    }
  }
`;
export function ProjectRevisionDetail({
  preloadedQuery,
}: RelayProps<{}, projectRevisionDetailQuery>) {
  const { session, projectRevision, allRevisionTypes } = usePreloadedQuery(
    ProjectRevisionDetailQuery,
    preloadedQuery
  );
  const taskList = (
    <TaskList
      projectRevision={
        projectRevision.projectByProjectId.latestCommittedProjectRevision
      }
      mode={"view"}
      projectRevisionDetailViewId={projectRevision.id}
      revisionType={projectRevision.revisionType}
    />
  );
  return (
    <>
      <DefaultLayout session={session} leftSideNav={taskList}>
        <header>
          <h2>{projectRevision.revisionType}</h2>
        </header>
        <div>
          <FormBase
            id={`form-${projectRevision.id}`}
            tagName={"dl"}
            className="project-revision-detail-form"
            schema={
              createProjectRevisionDetailSchema(allRevisionTypes) as JSONSchema7
            }
            uiSchema={createProjectRevisionUISchema()}
            ObjectFieldTemplate={EmptyObjectFieldTemplate}
            theme={readOnlyTheme}
            formData={projectRevision}
          ></FormBase>
          <div className="revision-record-history-section">
            <dt>Revision record history</dt>
            {projectRevision.updatedAt && (
              <dd>
                <h6>Updated by </h6>
                {projectRevision.cifUserByUpdatedBy?.fullName}
                <h6>on </h6>
                {getLocaleFormattedDate(
                  projectRevision.updatedAt,
                  "DATETIME_MED"
                )}
              </dd>
            )}
            <dd>
              <h6>Created by </h6>
              {projectRevision.cifUserByCreatedBy?.fullName}
              <h6>on </h6>
              {getLocaleFormattedDate(
                projectRevision.createdAt,
                "DATETIME_MED"
              )}
            </dd>
          </div>
        </div>
      </DefaultLayout>
      <style jsx>{`
        div :global(.definition-container) {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        div :global(.radio > label) {
          font-weight: normal;
        }
        div :global(input[type="radio"]) {
          margin-right: 1em;
        }
        div :global(.revision-record-history-section) {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        div :global(.revision-record-history-section > dd) {
          margin-bottom: 0;
        }
        div :global(.revision-record-history-section > dd > h6) {
          display: inline;
        }
      `}</style>
    </>
  );
}
export default withRelay(
  ProjectRevisionDetail,
  ProjectRevisionDetailQuery,
  withRelayOptions
);
