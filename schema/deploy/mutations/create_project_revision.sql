-- Deploy cif:mutations/create_project_revision_001 to pg

begin;

drop function cif.create_project_revision(project_id integer);

create or replace function cif.create_project_revision(project_id integer, revision_type varchar(1000) default 'Amendment')
returns cif.project_revision
as $function$
declare
  revision_row cif.project_revision;
  form_change_record record;
begin
  insert into cif.project_revision(project_id, change_status, revision_type)
  values ($1, 'pending', $2) returning * into revision_row;

  perform cif.create_form_change(
    operation => 'update',
    form_data_schema_name => 'cif',
    form_data_table_name => 'project',
    form_data_record_id => $1,
    project_revision_id => revision_row.id,
    json_schema_name => 'project'
  );


  for form_change_record in
  (
    select
      id,
      'update'::cif.form_change_operation as operation,
      'project_manager' as form_data_table_name,
      'project_manager' as json_schema_name
    from cif.project_manager
    where project_manager.project_id = $1
    and archived_at is null
  union
    select
      id,
      'update'::cif.form_change_operation as operation,
      'project_contact' as form_data_table_name,
      'project_contact' as json_schema_name
    from cif.project_contact
    where project_contact.project_id = $1
    and archived_at is null
  -- non-milestone reporting requirements
  union
    select
      id,
      'update'::cif.form_change_operation as operation,
      'reporting_requirement' as form_data_table_name,
      'reporting_requirement' as json_schema_name
    from cif.reporting_requirement
    where reporting_requirement.project_id = $1
    and archived_at is null
    and report_type not in ('General Milestone', 'Advanced Milestone', 'Reporting Milestone')
  -- milestone reporting requirements
  union
    select
      id,
      'update'::cif.form_change_operation as operation,
      'reporting_requirement' as form_data_table_name,
      'milestone' as json_schema_name
    from cif.reporting_requirement
    where reporting_requirement.project_id = $1
    and archived_at is null
    and report_type in ('General Milestone', 'Advanced Milestone', 'Reporting Milestone')
  union
    select
      eir.id,
      'update'::cif.form_change_operation as operation,
      'emission_intensity_report' as form_data_table_name,
      'emission_intensity_report' as json_schema_name
    from cif.emission_intensity_report eir
    join cif.reporting_requirement rr
    on eir.reporting_requirement_id = rr.id
    and rr.project_id = $1
    and eir.archived_at is null
  union
    select
      id,
      'update'::cif.form_change_operation as operation,
      'funding_parameter' as form_data_table_name,
      'funding_parameter' as json_schema_name
    from cif.funding_parameter
    where funding_parameter.project_id = $1
    and archived_at is null
  union
    select
      id,
      'update'::cif.form_change_operation as operation,
      'additional_funding_source' as form_data_table_name,
      'additional_funding_source' as json_schema_name
    from cif.additional_funding_source
    where additional_funding_source.project_id = $1
    and archived_at is null
  )
  loop
    perform cif.create_form_change(
      operation => form_change_record.operation,
      form_data_schema_name => 'cif',
      form_data_table_name => form_change_record.form_data_table_name,
      form_data_record_id => form_change_record.id,
      project_revision_id => revision_row.id,
      json_schema_name => form_change_record.json_schema_name
    );
  end loop;

  return revision_row;
end;
$function$ language plpgsql strict;


commit;
