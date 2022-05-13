import { Button } from "@button-inc/bcgov-theme";
import Grid from "@button-inc/bcgov-theme/Grid";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import projectReportingRequirementSchema from "data/jsonSchemaForm/projectReportingRequirementSchema";
import useDiscardFormChange from "hooks/useDiscardFormChange";
import { JSONSchema7 } from "json-schema";
import validateFormWithErrors from "lib/helpers/validateFormWithErrors";
import FormBorder from "lib/theme/components/FormBorder";
import EmptyObjectFieldTemplate from "lib/theme/EmptyObjectFieldTemplate";
import { useAddReportingRequirementToRevision } from "mutations/ProjectReportingRequirement/addReportingRequirementToRevision.ts";
import { useUpdateReportingRequirementFormChange } from "mutations/ProjectReportingRequirement/updateReportingRequirementFormChange";
import { useMemo, useRef } from "react";
import { graphql, useFragment } from "react-relay";
import { FormChangeOperation } from "__generated__/ProjectContactForm_projectRevision.graphql";
import { ProjectQuarterlyReportForm_projectRevision$key } from "__generated__/ProjectQuarterlyReportForm_projectRevision.graphql";
import FormBase from "./FormBase";
import SavingIndicator from "./SavingIndicator";

interface Props {
  onSubmit: () => void;
  projectRevision: ProjectQuarterlyReportForm_projectRevision$key;
}

const quarterlyReportUiSchema = {
  reportDueDate: {
    "ui:col-md": 12,
    "bcgov:size": "small",
    "ui:widget": "date",
  },
  submittedDate: {
    "ui:col-md": 12,
    "bcgov:size": "small",
    "ui:widget": "date",
  },
  comments: {
    "ui:col-md": 12,
    "bcgov:size": "small",
    "ui:widget": "TextAreaWidget",
  },
};

const ProjectQuarterlyReportForm: React.FC<Props> = (props) => {
  const formRefs = useRef({});

  const projectRevision = useFragment(
    graphql`
      fragment ProjectQuarterlyReportForm_projectRevision on ProjectRevision {
        id
        rowId
        projectQuarterlyReportFormChanges(first: 502)
          @connection(key: "connection_projectQuarterlyReportFormChanges") {
          __id
          edges {
            node {
              rowId
              id
              newFormData
              operation
              changeStatus
              formChangeByPreviousFormChangeId {
                changeStatus
                newFormData
              }
            }
          }
        }
        projectFormChange {
          formDataRecordId
        }
      }
    `,
    props.projectRevision
  );
  const [addQuarterlyReportMutation, isAdding] =
    useAddReportingRequirementToRevision();

  const addQuarterlyReport = (reportIndex: number) => {
    const formData = {
      status: "on_track",
      projectId: projectRevision.projectFormChange.formDataRecordId,
      reportType: "Quarterly",
      reportingRequirementIndex: reportIndex,
    };
    addQuarterlyReportMutation({
      variables: {
        projectRevisionId: projectRevision.rowId,
        newFormData: formData,
        connections: [projectRevision.projectQuarterlyReportFormChanges.__id],
      },
    });
  };

  const [applyUpdateFormChangeMutation, isUpdating] =
    useUpdateReportingRequirementFormChange();

  const updateFormChange = (
    formChange: {
      readonly id: string;
      readonly newFormData: any;
      readonly operation: FormChangeOperation;
      readonly changeStatus: string;
    },
    newFormData: any
  ) => {
    applyUpdateFormChangeMutation({
      variables: {
        input: {
          id: formChange.id,
          formChangePatch: {
            newFormData,
            changeStatus: formChange.changeStatus,
          },
        },
      },
      debounceKey: formChange.id,
      optimisticResponse: {
        updateFormChange: {
          formChange: {
            id: formChange.id,
            newFormData: newFormData,
            changeStatus: formChange.changeStatus,
          },
        },
      },
    });
  };

  const [discardFormChange] = useDiscardFormChange(
    projectRevision.projectQuarterlyReportFormChanges.__id
  );

  const deleteQuarterlyReport = (
    formChangeId: string,
    formChangeOperation: FormChangeOperation
  ) => {
    discardFormChange({
      formChange: { id: formChangeId, operation: formChangeOperation },
      onCompleted: () => {
        delete formRefs.current[formChangeId];
      },
    });
  };

  const stageQuarterlyReportFormChanges = async () => {
    const validationErrors = Object.keys(formRefs.current).reduce(
      (agg, formId) => {
        const formObject = formRefs.current[formId];
        return [...agg, ...validateFormWithErrors(formObject)];
      },
      []
    );

    const completedPromises: Promise<void>[] = [];

    projectRevision.projectQuarterlyReportFormChanges.edges.forEach(
      ({ node }) => {
        if (node.changeStatus === "pending") {
          const promise = new Promise<void>((resolve, reject) => {
            applyUpdateFormChangeMutation({
              variables: {
                input: {
                  id: node.id,
                  formChangePatch: {
                    changeStatus: "staged",
                  },
                },
              },
              debounceKey: node.id,
              onCompleted: () => {
                resolve();
              },
              onError: reject,
            });
          });
          completedPromises.push(promise);
        }
      }
    );
    try {
      await Promise.all(completedPromises);

      if (validationErrors.length === 0) props.onSubmit();
    } catch (e) {
      // the failing mutation will display an error message and send the error to sentry
    }
  };

  const [sortedQuarterlyReports, nextQuarterlyReportIndex] = useMemo(() => {
    const filteredReports =
      projectRevision.projectQuarterlyReportFormChanges.edges
        .map(({ node }) => node)
        .filter((report) => report.operation !== "ARCHIVE");

    filteredReports.sort(
      (a, b) =>
        a.newFormData.reportingRequirementIndex -
        b.newFormData.reportingRequirementIndex
    );
    const nextIndex =
      filteredReports.length > 0
        ? filteredReports[filteredReports.length - 1].newFormData
            .reportingRequirementIndex + 1
        : 1;

    return [filteredReports, nextIndex];
  }, [projectRevision.projectQuarterlyReportFormChanges]);

  return (
    <div>
      <header>
        <h2>Quarterly Reports</h2>

        <SavingIndicator isSaved={!isUpdating && !isAdding} />
      </header>

      <Grid cols={10} align="center">
        <Grid.Row>Quarterly reports status here</Grid.Row>
        <Grid.Row>
          <div className="column">
            <FormBorder>
              <Grid.Row className="addButtonContainer">
                <Button
                  variant="secondary"
                  onClick={() => addQuarterlyReport(nextQuarterlyReportIndex)}
                >
                  <FontAwesomeIcon icon={faPlusCircle} /> Add another quarterly
                  report
                </Button>
              </Grid.Row>
              {sortedQuarterlyReports.map((quarterlyReport, index) => {
                return (
                  <Grid.Row
                    key={quarterlyReport.id}
                    className="reportContainer"
                  >
                    <div className="column">
                      <h3>Quarterly Report {index + 1}</h3>
                      <FormBase
                        id={`form-${quarterlyReport.id}`}
                        idPrefix={`form-${quarterlyReport.id}`}
                        ref={(el) =>
                          (formRefs.current[quarterlyReport.id] = el)
                        }
                        formData={quarterlyReport.newFormData}
                        onChange={(change) => {
                          updateFormChange(
                            { ...quarterlyReport, changeStatus: "pending" },
                            change.formData
                          );
                        }}
                        schema={
                          projectReportingRequirementSchema as JSONSchema7
                        }
                        uiSchema={quarterlyReportUiSchema}
                        ObjectFieldTemplate={EmptyObjectFieldTemplate}
                      />
                    </div>
                    <div className="column">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() =>
                          deleteQuarterlyReport(
                            quarterlyReport.id,
                            quarterlyReport.operation
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </Grid.Row>
                );
              })}
            </FormBorder>
            <Grid.Row>
              <Button
                size="medium"
                variant="primary"
                onClick={stageQuarterlyReportFormChanges}
                disabled={isUpdating}
              >
                Submit Quarterly Reports
              </Button>
            </Grid.Row>
          </div>
        </Grid.Row>
      </Grid>
      <style jsx>{`
        div :global(button.pg-button) {
          margin-left: 0.4em;
          margin-right: 0em;
        }
        div :global(.right-aligned-column) {
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
        }
        div :global(.reportContainer) {
          border-top: 1px solid black;
          padding-top: 1em;
        }
        div :global(.addButtonContainer) {
          margin-bottom: 1em;
        }
        div :global(.column) {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
};

export default ProjectQuarterlyReportForm;
