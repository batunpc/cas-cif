begin;

select plan(3);

/** SETUP **/

truncate cif.project_revision restart identity cascade;

insert into cif.project_revision(id, change_status)
  overriding system value
  values (1, 'pending');

insert into cif.form_change(
  id,
  operation,
  form_data_schema_name,
  form_data_table_name,
  form_data_record_id,
  project_revision_id,
  json_schema_name,
  new_form_data
) overriding system value
values (
  1,
  'create',
  'cif',
  'reporting_requirement',
  1,
  1,
  'milestone',
  '{"reportType": "General Milestone", "hasExpenses": true, "maximumAmount": 15000, "totalEligibleExpenses": 20000, "reportingRequirementIndex": 1, "certifierProfessionalDesignation": "Professional Engineer"}'
),
(
  2,
  'create',
  'cif',
  'reporting_requirement',
  2,
  1,
  'milestone',
  '{"reportType": "General Milestone", "hasExpenses": true, "maximumAmount": 12000, "totalEligibleExpenses": 30000, "reportingRequirementIndex": 1, "certifierProfessionalDesignation": "Professional Engineer"}'
),
(
  3,
  'create',
  'cif',
  'reporting_requirement',
  3,
  1,
  'milestone',
  '{"reportType": "General Milestone", "hasExpenses": false, "maximumAmount": 12000, "totalEligibleExpenses": 30000, "reportingRequirementIndex": 1, "certifierProfessionalDesignation": "Professional Engineer"}'
);

insert into cif.form_change(
  id,
  operation,
  form_data_schema_name,
  form_data_table_name,
  form_data_record_id,
  project_revision_id,
  json_schema_name,
  new_form_data
) overriding system value
values (
  4,
  'create',
  'cif',
  'funding_parameter',
  1,
  1,
  'funding_parameter',
  '{"projectId": 1, "maxFundingAmount": 1000000, "provinceSharePercentage": 50}'
);
/** SETUP END **/


select is(
  (
    with record as (
    select row(form_change.*)::cif.form_change
    from cif.form_change where id=1
    ) select cif.form_change_calculated_gross_amount_this_milestone((select * from record))
  ),
  (
    10000.00::numeric
  ),
  'Returns the correct calculated amount when the amount does not exceed the maximum amount for the milestone: totalEligibleExpenses(20000) * provinceSharePercentage(50%)'
);

select is(
  (
    with record as (
    select row(form_change.*)::cif.form_change
    from cif.form_change where id=2
    ) select cif.form_change_calculated_gross_amount_this_milestone((select * from record))
  ),
  (
    12000.00::numeric
  ),
  'Returns the maximumAmount value when the calculated amount exceeds the maximum amount for the milestone'
);

select is(
  (
    with record as (
    select row(form_change.*)::cif.form_change
    from cif.form_change where id=3
    ) select cif.form_change_calculated_gross_amount_this_milestone((select * from record))
  ),
  (
    0::numeric
  ),
  'Returns 0 when hasExpenses is false'
);

select finish();

rollback;
