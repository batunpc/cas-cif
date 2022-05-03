-- Verify cif:tables/budget_item_category on pg

begin;

select pg_catalog.has_table_privilege('cif.budget_item_category', 'select');

-- cif_internal Grants
select cif_private.verify_grant('select', 'budget_item_category', 'cif_internal');
select cif_private.verify_grant('update', 'budget_item_category', 'cif_internal');
select cif_private.verify_grant('insert', 'budget_item_category', 'cif_internal');

-- cif_admin Grants
select cif_private.verify_grant('select', 'budget_item_category', 'cif_admin');
select cif_private.verify_grant('insert', 'budget_item_category', 'cif_admin');
select cif_private.verify_grant('update', 'budget_item_category', 'cif_admin');


rollback;
