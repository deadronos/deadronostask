/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as labels from "../labels.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_labels from "../lib/labels.js";
import type * as lib_utilities from "../lib/utilities.js";
import type * as lib_validations from "../lib/validations.js";
import type * as projects from "../projects.js";
import type * as subtasks from "../subtasks.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  labels: typeof labels;
  "lib/auth": typeof lib_auth;
  "lib/labels": typeof lib_labels;
  "lib/utilities": typeof lib_utilities;
  "lib/validations": typeof lib_validations;
  projects: typeof projects;
  subtasks: typeof subtasks;
  tasks: typeof tasks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
