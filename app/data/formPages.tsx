import ProjectContactForm from "components/Form/ProjectContactForm";
import ProjectContactFormSummary from "components/Form/ProjectContactFormSummary";
import ProjectForm from "components/Form/ProjectForm";
import ProjectFormSummary from "components/Form/ProjectFormSummary";
import ProjectManagerFormGroup from "components/Form/ProjectManagerFormGroup";
import ProjectManagerFormSummary from "components/Form/ProjectManagerFormSummary";
import ProjectMilestoneReportForm from "components/Form/ProjectMilestoneReportForm";
import ProjectQuarterlyReportForm from "components/Form/ProjectQuarterlyReportForm";
import ProjectAnnualReportForm from "components/Form/ProjectAnnualReportForm";
import ProjectQuarterlyReportFormSummary from "components/Form/ProjectQuarterlyReportFormSummary";
import ProjectAnnualReportFormSummary from "components/Form/ProjectAnnualReportFormSummary";
import ProjectMilestoneReportFormSummary from "components/Form/ProjectMilestoneReportFormSummary";
import ProjectFundingAgreementForm from "components/Form/ProjectFundingAgreementForm";
import ProjectFundingAgreementFormSummary from "components/Form/ProjectFundingAgreementFormSummary";
import ProjectEmissionIntensityReport from "components/Form/ProjectEmissionIntensityReportForm";
import ProjectEmissionIntensityReportSummary from "components/Form/ProjectEmissionIntensityReportFormSummary";

interface FormPageDefinition {
  title: string;
  editComponent; // TODO: can we require this attribute, but let typescript infer the type?
  viewComponent;
}

const formPages: FormPageDefinition[] = [
  {
    title: "project overview",
    editComponent: ProjectForm,
    viewComponent: ProjectFormSummary,
  },
  {
    title: "project managers",
    editComponent: ProjectManagerFormGroup,
    viewComponent: ProjectManagerFormSummary,
  },
  {
    title: "project contacts",
    editComponent: ProjectContactForm,
    viewComponent: ProjectContactFormSummary,
  },
  {
    title: "Funding Agreement Overview",
    editComponent: ProjectFundingAgreementForm,
    viewComponent: ProjectFundingAgreementFormSummary,
  },
  {
    title: "milestone reports",
    editComponent: ProjectMilestoneReportForm,
    viewComponent: ProjectMilestoneReportFormSummary,
  },
  {
    title: "quarterly reports",
    editComponent: ProjectQuarterlyReportForm,
    viewComponent: ProjectQuarterlyReportFormSummary,
  },
  {
    title: "emission reports",
    editComponent: ProjectEmissionIntensityReport,
    viewComponent: ProjectEmissionIntensityReportSummary,
  },
  {
    title: "annual reports",
    editComponent: ProjectAnnualReportForm,
    viewComponent: ProjectAnnualReportFormSummary,
  },
];

export default formPages;
