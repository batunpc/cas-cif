begin;


do $$
  declare
  temp_row record;
  begin

  -- insert milestone reports including payments
    for temp_row in select id, form_data_record_id, project_revision_id from cif.form_change where form_data_table_name = 'project'
    loop

      perform cif.create_form_change(
        'create',
        'milestone',
        'cif',
        'reporting_requirement',
        '{}'::jsonb,
        null,
        temp_row.project_revision_id
      );
      -- reporting requirement
      update cif.form_change set new_form_data =
      json_build_object(
        'projectId', temp_row.form_data_record_id,
        'reportDueDate', now(),
        'submittedDate', now(),
        'reportType', 'General Milestone',
        'reportingRequirementIndex', 1,
        'description', 'general milestone report description ' || temp_row.form_data_record_id,
        'adjustedGrossAmount', 1,
        'adjustedNetAmount', 1,
        'dateSentToCsnr', now(),
        'certifierProfessionalDesignation', 'Professional Engineer',
        'substantialCompletionDate', now(),
        'maximumAmount', 1,
        'totalEligibleExpenses', 1,
        'certifiedBy', 'Elliot Page',
        'hasExpenses', true
      )
      where form_data_table_name = 'reporting_requirement' and project_revision_id = temp_row.project_revision_id;

    end loop;

-- insert annual reports
    for temp_row in select id, project_id from cif.project_revision loop
      insert into cif.form_change(
        new_form_data,
        operation,
        form_data_schema_name,
        form_data_table_name,
        change_status,
        json_schema_name,
        project_revision_id
      )
      values
      (
        json_build_object(

          'reportDueDate', now(),
          'submittedDate', now(),
          'comments','annual report comments ' || temp_row.id,
          'projectId', (select form_data_record_id
                          from cif.form_change
                          where project_revision_id = temp_row.id
                          and form_data_table_name = 'project'
                        ),
          'reportType', 'Annual',
          'reportingRequirementIndex',1
          ),
        'create', 'cif', 'reporting_requirement', 'pending', 'reporting_requirement',temp_row.id);
    end loop;


-- insert quarterly reports
for temp_row in select id, project_id from cif.project_revision loop
      insert into cif.form_change(
        new_form_data,
        operation,
        form_data_schema_name,
        form_data_table_name,
        change_status,
        json_schema_name,
        project_revision_id
      )
      values
      (
        json_build_object(

          'reportDueDate', now(),
          'submittedDate', now(),
          'comments','quarterly report comments ' || temp_row.id,
          'projectId', (select form_data_record_id
                          from cif.form_change
                          where project_revision_id = temp_row.id
                          and form_data_table_name = 'project'
                        ),
          'reportType', 'Quarterly',
          'reportingRequirementIndex',1
          ),
        'create', 'cif', 'reporting_requirement', 'pending', 'reporting_requirement',temp_row.id);
    end loop;

  end
$$;

commit;
