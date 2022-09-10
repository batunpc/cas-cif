import { faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { useStageDirtyFormChanges } from "mutations/FormChange/stageDirtyFormChanges";
import {
  getProjectRevisionPageRoute,
  getProjectRevisionFormPageRoute,
  getProjectRevisionAttachmentsPageRoute,
} from "routes/pageRoutes";
import { useMemo, useEffect } from "react";
import { graphql, useFragment } from "react-relay";
import { TaskList_projectRevision$key } from "__generated__/TaskList_projectRevision.graphql";
import AttachmentsTaskListSection from "./AttachmentsTaskListSection";
import TaskListItem from "./TaskListItem";
import TaskListSection from "./TaskListSection";
import { TaskListMode } from "./types";
import { ATTENTION_REQUIRED_STATUS } from "./TaskListStatus";
import { DateTime } from "luxon";
import useShowGrowthbookFeature from "lib/growthbookWrapper";
import { getFormsInSection, numberedFormStructure } from "./viewModel";
import e from "express";

interface Props {
  projectRevision: TaskList_projectRevision$key;
  mode: TaskListMode;
}

const displayMilestoneDueDateStatus = (
  reportDueDate: string | undefined,
  submittedDate: string | undefined
) => {
  if (submittedDate) return "Completed";
  const diff = DateTime.fromISO(reportDueDate, {
    setZone: true,
    locale: "en-CA",
  }).diff(
    // Current date without time information
    DateTime.now().setZone("America/Vancouver").startOf("day"),
    "days"
  );
  if (diff.days < 0) return "Late";
  if (diff.days > 60)
    return `Due in ${Math.ceil(Math.ceil(diff.days) / 7)} weeks`;
  return `Due in ${Math.ceil(diff.days)} days`;
};

const TaskList: React.FC<Props> = ({ projectRevision, mode }) => {
  const {
    id,
    rowId,
    projectByProjectId,
    projectOverviewStatus,
    projectManagersStatus,
    projectContactsStatus,
    quarterlyReportsStatus,
    annualReportsStatus,
    milestoneReportStatuses,
    fundingAgreementStatus,
    teimpStatus,
  } = useFragment(
    // The JSON string is tripping up eslint
    // eslint-disable-next-line relay/graphql-syntax
    graphql`
      fragment TaskList_projectRevision on ProjectRevision {
        id
        rowId
        changeStatus
        projectByProjectId {
          proposalReference
        }
        projectOverviewStatus: tasklistStatusFor(formDataTableName: "project")
        projectContactsStatus: tasklistStatusFor(
          formDataTableName: "project_contact"
        )
        projectManagersStatus: tasklistStatusFor(
          formDataTableName: "project_manager"
        )
        quarterlyReportsStatus: tasklistStatusFor(
          formDataTableName: "reporting_requirement"
          jsonMatcher: "{\"reportType\":\"Quarterly\"}"
        )
        annualReportsStatus: tasklistStatusFor(
          formDataTableName: "reporting_requirement"
          jsonMatcher: "{\"reportType\":\"Annual\"}"
        )
        teimpStatus: tasklistStatusFor(
          formDataTableName: "emission_intensity_report"
        )
        fundingAgreementStatus: tasklistStatusFor(formDataTableName: "funding_parameter")
        milestoneReportStatuses {
          edges {
            node {
              milestoneIndex
              reportDueDate
              submittedDate
              formCompletionStatus
            }
          }
        }
      }
    `,
    projectRevision
  );
  const router = useRouter();

  const [stageDirtyFormChanges] = useStageDirtyFormChanges();
  useEffect(() => {
    if (mode !== "view")
      stageDirtyFormChanges({
        variables: {
          input: {
            projectRevisionId: rowId,
          },
        },
      });
    // We only want to run this effect on mount, so we use an empty array as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, mode]);

  const currentStep = useMemo(() => {
    if (!router || !router.pathname) return null;
    return (router.query.formIndex as string) ?? "summary";
  }, [router]);

  // Growthbook - teimp
  const sectionIndex = {
    annual: useShowGrowthbookFeature("teimp") ? 7 : 6,
    summary: useShowGrowthbookFeature("teimp") ? 8 : 7,
  };

  const tasklistFormConfiguration = {
    projectOverview: [{ status: projectOverviewStatus }],
    projectManagers: [{ status: projectManagersStatus }],
    projectContacts: [{ status: projectContactsStatus }],
    quarterlyReports: [{ status: quarterlyReportsStatus }],
    annualReports: [{ status: annualReportsStatus }],
    projectMilestones: milestoneReportStatuses.edges.map((edge) => {
      return { ...edge.node, status: edge.node.formCompletionStatus };
    }),
    fundingAgreement: [{ status: fundingAgreementStatus }],
    teimp: [{ status: teimpStatus }],
  };

  return (
    <div className="container">
      <h2>
        {mode === "view"
          ? projectByProjectId.proposalReference
          : mode === "update"
          ? "Editing: " + projectByProjectId.proposalReference
          : "Add a Project"}
      </h2>
      <ol>
        {numberedFormStructure.map((section) => {
          const formsInSection = getFormsInSection(section);

          return (
            <TaskListSection
              key={`tasklist_section_${section.sectionNumber}`}
              defaultExpandedState={
                /* Tasklist section is expanded if either the current step is one of its forms,
                 * or if any of its forms has the Attention Required status */
                formsInSection
                  .map((f) => f.formIndex)
                  .includes(Number(currentStep)) ||
                formsInSection.some((form) =>
                  tasklistFormConfiguration[form.slug].some(
                    (config) => config.status === ATTENTION_REQUIRED_STATUS
                  )
                )
              }
              listItemNumber={String(section.sectionNumber)}
              listItemName={section.title}
              listItemMode={
                mode !== "update" && section.optional ? "(optional)" : ""
              }
            >
              {section.items?.map(
                (item) =>
                  item.formConfiguration && (
                    <TaskListItem
                      stepName={String(item.formConfiguration.formIndex)}
                      linkUrl={getProjectRevisionFormPageRoute(
                        id,
                        item.formConfiguration.formIndex
                      )}
                      formTitle={item.title}
                      formStatus={
                        tasklistFormConfiguration[item.formConfiguration.slug]
                          .status
                      }
                      currentStep={currentStep}
                      mode={mode}
                    />
                  )
              )}
              {section.formConfiguration &&
                tasklistFormConfiguration[section.formConfiguration.slug]
                  .length === 0 && (
                  <TaskListItem
                    stepName={String(section.formConfiguration.formIndex)}
                    linkUrl={getProjectRevisionFormPageRoute(
                      id,
                      section.formConfiguration.formIndex
                    )}
                    formTitle={section.title}
                    formStatus={null} // No status as there are no milestones
                    currentStep={currentStep}
                    mode={mode}
                  />
                )}
              {section.formConfiguration &&
                tasklistFormConfiguration[section.formConfiguration.slug]
                  .length > 0 &&
                tasklistFormConfiguration[section.formConfiguration.slug].map(
                  (config, index) => (
                    <TaskListItem
                      key={config.milestoneIndex}
                      stepName="4"
                      linkUrl={getProjectRevisionFormPageRoute(
                        id,
                        section.formConfiguration.formIndex,
                        `Milestone${index + 1}`
                      )}
                      formTitle={`Milestone ${index + 1}`}
                      formStatus={config.status}
                      milestoneDueDate={displayMilestoneDueDateStatus(
                        config.reportDueDate,
                        config.submittedDate
                      )}
                      currentStep={currentStep}
                      mode={mode}
                      hasAnchor={true}
                    />
                  )
                )}
            </TaskListSection>
          );
        })}
      </ol>
      <style jsx>{`
        ol {
          list-style: none;
          margin: 0;
        }

        h2 {
          font-size: 1.25rem;
          margin: 0;
          padding: 20px 0 10px 0;
          border-bottom: 1px solid #d1d1d1;
          text-indent: 15px;
        }

        div :global(a) {
          color: #1a5a96;
        }

        div :global(a:hover) {
          text-decoration: none;
          color: blue;
        }

        div.container {
          background-color: #e5e5e5;
          width: 400px;
        }
      `}</style>
    </div>
  );

  return (
    <div className="container">
      <h2>
        {mode === "view"
          ? projectByProjectId.proposalReference
          : mode === "update"
          ? "Editing: " + projectByProjectId.proposalReference
          : "Add a Project"}
      </h2>
      <ol>
        {/* Project Overview Section */}
        <TaskListSection
          defaultExpandedState={
            currentStep === "0" ||
            projectOverviewStatus === ATTENTION_REQUIRED_STATUS
          }
          listItemNumber="1"
          listItemName="Project Overview"
        >
          <TaskListItem
            stepName="0"
            linkUrl={getProjectRevisionFormPageRoute(id, 0)}
            formTitle="Project overview"
            formStatus={projectOverviewStatus}
            currentStep={currentStep}
            mode={mode}
          />
        </TaskListSection>

        {/* Project Details Section */}
        <TaskListSection
          defaultExpandedState={
            currentStep === "1" ||
            currentStep === "2" ||
            projectManagersStatus === ATTENTION_REQUIRED_STATUS ||
            projectContactsStatus === ATTENTION_REQUIRED_STATUS
          }
          listItemNumber="2"
          listItemName="Project Details"
          listItemMode={mode === "update" ? "" : "(optional)"}
        >
          <TaskListItem
            stepName="1"
            linkUrl={getProjectRevisionFormPageRoute(id, 1)}
            formTitle="Project managers"
            formStatus={projectManagersStatus}
            currentStep={currentStep}
            mode={mode}
          />
          <TaskListItem
            stepName="2"
            linkUrl={getProjectRevisionFormPageRoute(id, 2)}
            formTitle="Project contacts"
            formStatus={projectContactsStatus}
            currentStep={currentStep}
            mode={mode}
          />
        </TaskListSection>

        {/* Budget Details Section */}
        <TaskListSection
          defaultExpandedState={
            currentStep === "3" ||
            fundingAgreementStatus === ATTENTION_REQUIRED_STATUS
          }
          listItemNumber="3"
          listItemName="Budgets, Expenses & Payments"
        >
          <TaskListItem
            stepName="3"
            linkUrl={getProjectRevisionFormPageRoute(id, 3)}
            formTitle="Budgets"
            formStatus={fundingAgreementStatus}
            currentStep={currentStep}
            mode={mode}
          />
        </TaskListSection>

        {/* Milestone Reports Section */}
        <TaskListSection
          defaultExpandedState={
            currentStep === "4" ||
            milestoneReportStatuses.edges.some(
              ({ node }) =>
                node.formCompletionStatus === ATTENTION_REQUIRED_STATUS
            )
          }
          listItemNumber="4"
          listItemName="Milestone Reports"
        >
          {milestoneReportStatuses.edges.length === 0 ? (
            <TaskListItem
              stepName="4"
              linkUrl={getProjectRevisionFormPageRoute(id, 4)}
              formTitle="Milestone reports"
              formStatus={null} // No status as there are no milestones
              currentStep={currentStep}
              mode={mode}
            />
          ) : (
            milestoneReportStatuses.edges.map(({ node }, index) => (
              <TaskListItem
                key={node.milestoneIndex}
                stepName="4"
                linkUrl={getProjectRevisionFormPageRoute(
                  id,
                  4,
                  `Milestone${index + 1}`
                )}
                formTitle={`Milestone ${index + 1}`}
                formStatus={node.formCompletionStatus}
                milestoneDueDate={displayMilestoneDueDateStatus(
                  node.reportDueDate,
                  node.submittedDate
                )}
                currentStep={currentStep}
                mode={mode}
                hasAnchor={true}
              />
            ))
          )}
        </TaskListSection>

        {/* Quarterly Reports Section */}
        <TaskListSection
          defaultExpandedState={
            currentStep === "5" ||
            quarterlyReportsStatus === ATTENTION_REQUIRED_STATUS
          }
          listItemNumber="5"
          listItemName="Quarterly Reports"
        >
          <TaskListItem
            stepName="5"
            linkUrl={getProjectRevisionFormPageRoute(id, 5)}
            formTitle="Quarterly reports"
            formStatus={quarterlyReportsStatus}
            currentStep={currentStep}
            mode={mode}
          />
        </TaskListSection>

        {/* Emissions Intensity Report */}
        {/* Growthbook - teimp */}
        {useShowGrowthbookFeature("teimp") && (
          <TaskListSection
            defaultExpandedState={
              currentStep === "6" || teimpStatus === ATTENTION_REQUIRED_STATUS
            }
            listItemNumber="6"
            listItemName="Emissions Intensity Report"
          >
            <TaskListItem
              stepName="6"
              linkUrl={getProjectRevisionFormPageRoute(id, 6)}
              formTitle="Emissions Intensity Report"
              formStatus={teimpStatus}
              currentStep={currentStep}
              mode={mode}
            />
          </TaskListSection>
        )}

        {/* Annual Reports Section */}
        <TaskListSection
          defaultExpandedState={
            currentStep === String(sectionIndex.annual) ||
            annualReportsStatus === ATTENTION_REQUIRED_STATUS
          }
          listItemNumber={String(sectionIndex.annual)}
          listItemName="Annual Reports"
        >
          <TaskListItem
            stepName={String(sectionIndex.annual)}
            linkUrl={getProjectRevisionFormPageRoute(id, sectionIndex.annual)}
            formTitle="Annual reports"
            formStatus={annualReportsStatus}
            currentStep={currentStep}
            mode={mode}
          />
        </TaskListSection>

        {/* Project Summary Section */}
        {mode !== "view" && (
          <TaskListSection
            defaultExpandedState={currentStep === "summary"}
            listItemNumber={String(sectionIndex.summary)}
            listItemName="Submit changes"
          >
            <TaskListItem
              stepName="summary"
              linkUrl={getProjectRevisionPageRoute(id)}
              formTitle="Review and submit information"
              formStatus={null}
              currentStep={currentStep}
              mode={mode}
            />
          </TaskListSection>
        )}

        {/* Attachments Section */}
        {mode === "view" && (
          <AttachmentsTaskListSection
            icon={faPaperclip}
            title="Attachments"
            linkUrl={getProjectRevisionAttachmentsPageRoute(id)}
          />
        )}
      </ol>
      <style jsx>{`
        ol {
          list-style: none;
          margin: 0;
        }

        h2 {
          font-size: 1.25rem;
          margin: 0;
          padding: 20px 0 10px 0;
          border-bottom: 1px solid #d1d1d1;
          text-indent: 15px;
        }

        div :global(a) {
          color: #1a5a96;
        }

        div :global(a:hover) {
          text-decoration: none;
          color: blue;
        }

        div.container {
          background-color: #e5e5e5;
          width: 400px;
        }
      `}</style>
    </div>
  );
};

export default TaskList;
