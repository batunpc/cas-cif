import safeJsonParse from "lib/safeJsonParse";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import FilterRow from "./FilterRow";
import { FilterArgs, PageArgs, TableFilter } from "./Filters";
import Pagination from "./Pagination";
import SortableHeader from "./SortableHeader";

interface Props {
  filters: TableFilter[];
  paginated?: boolean;
  totalRowCount?: number;
  emptyStateContents?: JSX.Element | string;
}

const Table: React.FC<Props> = ({
  filters,
  paginated,
  totalRowCount,
  children,
  emptyStateContents = <span className="no-results">No results found.</span>,
}) => {
  const router = useRouter();
  const filterArgs = useMemo<FilterArgs>(
    () => safeJsonParse(router.query.filterArgs as string),
    [router]
  );

  const { offset, pageSize } = useMemo<PageArgs>(
    () => safeJsonParse(router.query.pageArgs as string),
    [router]
  );

  const applyFilterArgs = (newFilterArgs: FilterArgs) => {
    const newQuery = {
      // copy the vars from the query string, so that the args coming from extraFilters are not overriden
      ...filterArgs,
      ...newFilterArgs,
    };
    filters.forEach((filter) => {
      filter.argNames.forEach((argName) => {
        newQuery[argName] = newFilterArgs[argName] ?? undefined;
      });
    });

    const queryString = JSON.stringify(newQuery);

    const url = {
      pathname: router.pathname,
      query: {
        ...router.query,
        filterArgs: queryString,
        pageArgs: JSON.stringify({ offset: 0, pageSize }),
      },
    };

    router.push(url, url, { shallow: true });
  };

  const applyPageArgs = (newPageArgs: PageArgs) => {
    const url = {
      pathname: router.pathname,
      query: {
        ...router.query,
        pageArgs: JSON.stringify(newPageArgs),
      },
    };
    router.push(url, url, { shallow: true });
  };

  const handleOffsetChange = (value: number) => {
    applyPageArgs({ offset: value, pageSize });
  };

  const handleMaxResultsChange = (value: number) => {
    applyPageArgs({ offset: 0, pageSize: value });
  };

  const rows = React.Children.toArray(children);

  return (
    <>
      <table className="bc-table">
        {/* class name is used to increase specificity of CSS selectors and override defaults */}
        <thead>
          <tr>
            {filters.map((filter) => (
              <SortableHeader
                key={filter.title + "-header"}
                orderByPrefix={filter.orderByPrefix}
                displayName={filter.title}
                sortable={filter.isSortEnabled}
              />
            ))}
          </tr>

          <FilterRow
            filterArgs={filterArgs}
            filters={filters}
            onSubmit={applyFilterArgs}
          />
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <tr>
              <td colSpan={filters.length}>{emptyStateContents}</td>
            </tr>
          )}
        </tbody>
        {paginated && (
          <tfoot>
            <tr>
              <Pagination
                totalCount={totalRowCount}
                offset={offset}
                pageSize={pageSize}
                onOffsetChange={handleOffsetChange}
                onPageSizeChange={handleMaxResultsChange}
              />
            </tr>
          </tfoot>
        )}
      </table>
      <style jsx>{`
        table.bc-table {
          margin-top: 1rem;
          border-collapse: separate;
          border-spacing: 0;
        }

        :global(tr:nth-child(even)) {
          background-color: #f5f5f5;
        }

        :global(tr:nth-child(odd)) {
          background-color: white;
        }

        :global(table.bc-table td) {
          border-right: 1px solid #939393;
          border-bottom: 1px solid #939393;
          text-align: left;
          padding: 0.5rem;
        }

        :global(td:first-child) {
          border-left: 1px solid #939393;
        }

        :global(.no-results) {
          width: 100%;
          display: inline-block;
          text-align: center;
          font-style: italic;
        }

        :global(table.bc-table tfoot tr, table.bc-table tfoot td) {
          border: none;
          background-color: transparent;
        }
      `}</style>
    </>
  );
};

export default Table;
