import TaskListStatus from "./TaskListStatus";
import BCGovLink from "@button-inc/bcgov-theme/Link";
import Link from "next/link";
import { TaskListMode } from "./types";

interface Props {
  stepName: string;
  linkUrl: { pathname: string; query: { projectRevision: string } };
  formTitle: string;
  formStatus: string;
  currentStep: string;
  mode: TaskListMode;
}

const FormListItem: React.FC<Props> = ({
  stepName,
  linkUrl,
  formTitle,
  formStatus,
  currentStep,
  mode,
}) => {
  return (
    <li
      aria-current={currentStep === stepName ? "step" : false}
      className="bordered"
    >
      <Link passHref href={linkUrl}>
        <BCGovLink>
          {mode === "view" || stepName === "summary"
            ? formTitle
            : `${
                mode === "update" ? "Edit" : "Add"
              } ${formTitle.toLowerCase()}`}
        </BCGovLink>
      </Link>
      {mode !== "view" && <TaskListStatus formStatus={formStatus} />}

      <style jsx>{`
        li {
          margin-bottom: 0;
          display: flex;
          justify-content: space-between;
        }
        li[aria-current="step"],
        li[aria-current="step"] div {
          background-color: #fafafc;
        }
        .bordered {
          border-bottom: 1px solid #d1d1d1;
          padding: 10px 0 10px 0;
        }
      `}</style>
    </li>
  );
};

export default FormListItem;
