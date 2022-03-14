import type { Request } from "express";
import {
  postgraphile,
  createPostGraphileSchema,
  withPostGraphileContext,
} from "postgraphile";
import { pgPool, getDatabaseUrl } from "../../db";
import { makePluginHook, PostGraphileOptions } from "postgraphile";
import PostgraphileRc from "../../../.postgraphilerc";
import PgManyToManyPlugin from "@graphile-contrib/pg-many-to-many";
import PostgraphileLogConsola from "postgraphile-log-consola";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";
import { TagsFilePlugin } from "postgraphile/plugins";
import PostGraphileUploadFieldPlugin from "postgraphile-plugin-upload-field";
import PgOmitArchived from "@graphile-contrib/pg-omit-archived";
import PgOrderByRelatedPlugin from "@graphile-contrib/pg-order-by-related";
import authenticationPgSettings from "./authenticationPgSettings";
import { generateDatabaseMockOptions } from "../../helpers/databaseMockPgOptions";
import FormChangeValidationPlugin from "./formChangeValidationPlugin";
import { graphql, GraphQLSchema } from "graphql";
import * as Sentry from "@sentry/nextjs";

async function saveRemoteFile({ stream }) {
  const response = await fetch(
    `${process.env.STORAGE_API_HOST}/api/v1/attachments/upload`,
    {
      method: "POST",
      headers: {
        "api-key": process.env.STORAGE_API_KEY,
        "Content-Type": "multipart/form-data",
      },
      body: stream,
    }
  );
  try {
    return await response.json();
  } catch (e) {
    console.error(e);
  }
}

async function resolveUpload(upload) {
  const { createReadStream } = upload;
  const stream = createReadStream();

  // Save tile to remote storage system
  const { uuid } = await saveRemoteFile({ stream });

  return uuid;
}

// Use consola for logging instead of default logger
const pluginHook = makePluginHook([PostgraphileLogConsola]);

export const pgSettings = (req: Request) => {
  const opts = {
    ...authenticationPgSettings(req),
    ...generateDatabaseMockOptions(req.cookies, ["mocks.mocked_timestamp"]),
  };
  return opts;
};

let postgraphileOptions: PostGraphileOptions = {
  pluginHook,
  appendPlugins: [
    PgManyToManyPlugin,
    ConnectionFilterPlugin,
    TagsFilePlugin,
    PostGraphileUploadFieldPlugin,
    PgOmitArchived,
    PgOrderByRelatedPlugin,
    FormChangeValidationPlugin,
  ],
  classicIds: true,
  enableQueryBatching: true,
  dynamicJson: true,
  graphileBuildOptions: {
    ...PostgraphileRc.options.graphileBuildOptions,
    uploadFieldDefinitions: [
      {
        match: ({ table, column }) =>
          table === "attachment" && column === "file",
        resolve: resolveUpload,
      },
    ],
  },
  pgSettings,
};

if (process.env.SENTRY_ENVIRONMENT) {
  postgraphileOptions = {
    ...postgraphileOptions,
    handleErrors: (errors) => {
      Sentry.captureException(errors);
      return errors;
    },
  };
} else {
  postgraphileOptions = {
    ...postgraphileOptions,
    extendedErrors: ["hint", "detail", "errcode"],
    showErrorStack: "json",
  };
}

if (process.env.NODE_ENV === "production") {
  postgraphileOptions = {
    ...postgraphileOptions,
    retryOnInitFail: true,
  };
} else {
  postgraphileOptions = {
    ...postgraphileOptions,
    graphiql: true,
    enhanceGraphiql: true,
    allowExplain: true,
  };
}

const postgraphileMiddleware = () => {
  return postgraphile(
    pgPool,
    process.env.DATABASE_SCHEMA || "cif",
    postgraphileOptions
  );
};

export default postgraphileMiddleware;

let postgraphileSchemaSingleton: GraphQLSchema;

const postgraphileSchema = async () => {
  if (!postgraphileSchemaSingleton) {
    postgraphileSchemaSingleton = await createPostGraphileSchema(
      getDatabaseUrl(),
      process.env.DATABASE_SCHEMA || "cif",
      postgraphileOptions
    );
  }

  return postgraphileSchemaSingleton;
};

export async function performQuery(query, variables, request: Request) {
  const settings = pgSettings(request);
  return withPostGraphileContext(
    {
      pgPool,
      pgSettings: settings,
    },
    async (context) => {
      // Execute your GraphQL query in this function with the provided
      // `context` object, which should NOT be used outside of this
      // function.
      return graphql(
        await postgraphileSchema(),
        query,
        null,
        { ...context }, // You can add more to context if you like
        variables
      );
    }
  );
}
