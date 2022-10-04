-- Deploy cif:mutations/generate_reports to pg

begin;

create or replace function cif.generate_reports(revision_id int, report_type text, start_date timestamptz, end_date timestamptz)
  returns setof cif.form_change as $generate_reports$
  declare
  form_change_record record;
  start_date_year int := extract(year from start_date);
  report_interval_start_date timestamptz;
  report_interval interval := '1 year';
  initial_index int := 1;
  temp_row record;
begin
  if start_date >= end_date then
      raise exception 'start_date must be before end_date';

  elsif $2 = 'Annual' then
    -- if start date is before or equal to jan 31st, we will start the first annual report on the same year otherwise we will start on the next year
    if start_date <= make_date(start_date_year, 01, 31) then
      report_interval_start_date := make_date(start_date_year, 01, 31);
    else
      report_interval_start_date := make_date(start_date_year + 1, 01, 31);
    end if;

  elsif $2 = 'Quarterly' then
    report_interval := '3 month'::interval;
    -- choosing the closest quarter start date from a list of possible dates as a temporary table
    select * from
      (values (make_date(start_date_year, 01, 05)), (make_date(start_date_year, 04, 05)), (make_date(start_date_year, 07, 05)), (make_date(start_date_year, 10, 05)), (make_date(start_date_year + 1, 01, 05))) as temp_table(quarterly_report_due_date)
      where start_date <= quarterly_report_due_date limit 1 into report_interval_start_date;
  end if;

  -- generating the reports
  for temp_row in select generate_series(report_interval_start_date, end_date, report_interval) as due_date
    loop
    insert into cif.form_change(
      new_form_data,
      operation,
      form_data_schema_name,
      form_data_table_name,
      json_schema_name,
      project_revision_id
    )
    values
    (
    json_build_object(
      'projectId', (select form_data_record_id from cif.form_change where form_data_table_name='project' and project_revision_id=$1),
      'reportType', $2,
      'reportDueDate', temp_row.due_date,
      'reportingRequirementIndex', initial_index
    ),
    'create', 'cif', 'reporting_requirement', 'reporting_requirement', $1) returning * into form_change_record;
    initial_index := initial_index + 1;
    return next form_change_record;
  end loop;
end;
  $generate_reports$ language plpgsql volatile;

grant execute on function cif.generate_reports to cif_internal, cif_external, cif_admin;
comment on function cif.generate_reports
is $$
  Custom mutation to generate reports for a revision between contract_start_date and  measurement_period_end_date for quarterly reports
  and between report_due_date and project_assets_life_end_date for annual reports.
$$;

commit;
