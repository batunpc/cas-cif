import projectContactSchema from "./projectContactSchema";
import { projectReportingRequirementSchema } from "./projectReportingRequirementSchema";
import projectManagerSchema from "./projectManagerSchema";
import projectSchema from "./projectSchema";
import contactSchema from "./contactSchema";
import operatorSchema from "./operatorSchema";
import { milestoneSchema } from "./projectMilestoneSchema";
import { fundingAgreementSchema } from "./fundingAgreementSchema";
import { paymentSchema } from "./paymentSchema";
import {
  emissionIntensityReportSchema,
  emissionIntensityReportingRequirementSchema,
} from "./projectEmissionIntensitySchema";
import additionalFundingSourceSchema from "./additionalFundingSourceSchema";

const validationSchemas = {
  project_contact: projectContactSchema,
  project_manager: projectManagerSchema,
  reporting_requirement: projectReportingRequirementSchema,
  project: projectSchema,
  contact: contactSchema,
  operator: operatorSchema,
  milestone_report: milestoneSchema,
  funding_parameter: fundingAgreementSchema,
  payment: paymentSchema,
  emission_intensity_report: emissionIntensityReportSchema,
  emission_intensity_reporting_requirement:
    emissionIntensityReportingRequirementSchema,
  additional_funding_source: additionalFundingSourceSchema,
};

export default validationSchemas;
