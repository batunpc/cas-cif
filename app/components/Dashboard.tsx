import { useCallback, useMemo } from "react";
import Link from "next/link";
import BCGovLink from "@button-inc/bcgov-theme/Link";
import { useFragment, graphql } from "react-relay";
import { Dashboard_query$key } from "__generated__/Dashboard_query.graphql";
import {
  getContactsPageRoute,
  getOperatorsPageRoute,
  getProjectRevisionFormPageRoute,
  getProjectsPageRoute,
} from "routes/pageRoutes";
import { getMetabaseRoute, getSupportEmailMailTo } from "routes/externalRoutes";
import { mutation as createProjectMutation } from "mutations/Project/createProject";
import { createProjectMutation$data } from "__generated__/createProjectMutation.graphql";
import { useRouter } from "next/router";
import useIsAdmin from "hooks/useIsAdmin";
import useMutationWithErrorMessage from "mutations/useMutationWithErrorMessage";

interface Props {
  query: Dashboard_query$key;
}

const Dashboard: React.FC<Props> = ({ query: queryKey }) => {
  const router = useRouter();
  const { session, pendingNewProjectRevision } = useFragment(
    graphql`
      fragment Dashboard_query on Query {
        session {
          cifUserBySub {
            givenName
          }
          userGroups
        }
        pendingNewProjectRevision {
          id
        }
      }
    `,
    queryKey
  );

  const [createProject, isProjectCreating] = useMutationWithErrorMessage(
    createProjectMutation,
    () => "An error occurred when creating a project."
  );

  const handleProjectCreation = useCallback(() => {
    if (isProjectCreating) return;
    createProject({
      variables: { input: {} },
      onCompleted: (response: createProjectMutation$data) => {
        router.push(
          getProjectRevisionFormPageRoute(
            response.createProject.projectRevision.id,
            0
          )
        );
      },
    });
  }, [createProject, isProjectCreating, router]);

  const isAdmin = useIsAdmin(session?.userGroups);

  const addOrResumeProjectLink = useMemo(
    () =>
      pendingNewProjectRevision ? (
        <Link
          passHref
          href={getProjectRevisionFormPageRoute(
            pendingNewProjectRevision.id,
            0
          )}
        >
          <BCGovLink>Resume Project Draft</BCGovLink>
        </Link>
      ) : (
        <button onClick={handleProjectCreation} disabled={isProjectCreating}>
          Create a new Project
        </button>
      ),
    [pendingNewProjectRevision, handleProjectCreation, isProjectCreating]
  );

  return (
    <>
      <header>
        <h2>Welcome, {session.cifUserBySub?.givenName}</h2>
      </header>
      <div>
        <section>
          <div id="projects-heading">
            <h3>Projects</h3>
            <small>Create, view and manage projects</small>
          </div>
          <nav aria-labelledby="projects-heading">
            <Link passHref href={getProjectsPageRoute()}>
              <BCGovLink>Projects List</BCGovLink>
            </Link>
            {addOrResumeProjectLink}
          </nav>
        </section>
        <section>
          <div id="reporting-op-heading">
            <h3>Reporting Operations</h3>
            <small>Create, manage and search</small>
          </div>
          <nav aria-labelledby="reporting-op-heading">
            <Link passHref href={getOperatorsPageRoute()}>
              <BCGovLink>Operators</BCGovLink>
            </Link>
            <Link passHref href={getContactsPageRoute()}>
              <BCGovLink>Contacts</BCGovLink>
            </Link>
          </nav>
        </section>
        {isAdmin && (
          <section>
            <div id="admin-heading">
              <h3>Administration</h3>
            </div>
            <nav aria-labelledby="admin-heading">
              <Link passHref href={getMetabaseRoute()}>
                <BCGovLink target="_blank">Data Insights (Metabase)</BCGovLink>
              </Link>
              <Link
                passHref
                href={
                  getSupportEmailMailTo("CIF App: Report a problem!").pathname
                }
              >
                <BCGovLink target="_blank">Report a Problem</BCGovLink>
              </Link>
            </nav>
          </section>
        )}
      </div>
      <style jsx>{`
        div,
        nav {
          display: flex;
          flex-wrap: wrap;
        }

        section {
          width: 18rem;
          margin: 1rem;
          border: 1px solid #939393;
          border-radius: 4px;
        }

        section > div {
          min-height: 5.2rem;
        }

        :global(section > nav > *),
        section > div {
          padding: 0.75rem 1.25rem;
        }

        section > nav {
          flex-direction: column;
        }

        :global(section > nav > *:not(:last-child)),
        section > div {
          border-bottom: 1px solid #939393;
        }

        :global(button) {
          color: #1a5a96;
          background: transparent;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          text-align: left;
        }
        :global(button:hover) {
          text-decoration: none;
          color: blue;
        }
      `}</style>
    </>
  );
};

export default Dashboard;
