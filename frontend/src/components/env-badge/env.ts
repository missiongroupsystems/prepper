/**
 * Which tier a deployment serves (0.133.0), read from `NEXT_PUBLIC_APP_ENV` and nothing else: never
 * the hostname, never `VERCEL_ENV`. A hostname is a guess that breaks on the first alias or custom
 * domain, and Vercel's own environments don't line up with ours (staging is a PREVIEW environment
 * there), so the tier is set by name, per Vercel environment, by the person who owns the project.
 *
 * Unset is decided by where the build ran. Off Vercel it is a developer's machine, so `local`. On
 * Vercel a missing (or unrecognised) value is a misconfiguration, and it is shown as one, a red
 * "ENV UNSET" pill, rather than guessed into production and rendered as nothing.
 *
 * No Workforce imports: this folder is copied into other Mission apps as-is (ADOPT.md).
 */

export const APP_ENVS = ["production", "staging", "preview", "local"] as const;
export type AppEnv = (typeof APP_ENVS)[number];
/** What the badge shows: a known tier, or `unset` for a Vercel build without a recognisable one. */
export type AppEnvState = AppEnv | "unset";
export type BadgedEnv = Exclude<AppEnvState, "production">;

/** A commit SHA is shown to this many characters, as git itself abbreviates it. */
const SHORT_SHA_CHARS = 7;

function isAppEnv(value: string): value is AppEnv {
  return (APP_ENVS as readonly string[]).includes(value);
}

export function resolveAppEnv(value: string | undefined, onVercel: boolean): AppEnvState {
  const tier = value?.trim().toLowerCase() ?? "";
  if (isAppEnv(tier)) return tier;
  return tier === "" && !onVercel ? "local" : "unset";
}

/**
 * The deployment's tier. SERVER ONLY: `VERCEL` is not a `NEXT_PUBLIC_` variable, so in a client
 * bundle it reads as unset and a Vercel build would call itself local. Resolve it on the server
 * and pass the result down as a prop.
 */
export function readAppEnv(): AppEnvState {
  return resolveAppEnv(process.env.NEXT_PUBLIC_APP_ENV, Boolean(process.env.VERCEL));
}

/** The commit this deployment was built from, from Vercel's own system variable; null off Vercel. */
export function readBuild(): string | null {
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, SHORT_SHA_CHARS) || null;
}

/**
 * Each badged tier's words and colours. The label is uppercase in the source, not by CSS, so a
 * screen reader and a copied title read the same thing. The classes are Tailwind utilities over the
 * `--color-env-*` tokens the host app defines (ADOPT.md); no hex lives here.
 */
export const ENV_BADGE: Record<BadgedEnv, { label: string; description: string; className: string }> = {
  staging: { label: "STAGING", description: "Staging environment", className: "bg-env-staging-bg text-env-staging" },
  preview: { label: "PREVIEW", description: "Preview deployment", className: "bg-env-preview-bg text-env-preview" },
  local: { label: "LOCAL", description: "Running locally", className: "bg-env-local-bg text-env-local" },
  unset: {
    label: "ENV UNSET",
    description: "NEXT_PUBLIC_APP_ENV isn't set to a known tier for this deployment",
    className: "bg-env-unset-bg text-env-unset",
  },
};

/** A page title with the tier in front, e.g. "[STAGING] Workforce"; production's is untouched. */
export function envTitle(title: string, env: AppEnvState): string {
  return env === "production" ? title : `[${ENV_BADGE[env].label}] ${title}`;
}

/** The root layout's `metadata.title`: the default and every child page's title, both prefixed. */
export function envMetadataTitle(title: string, env: AppEnvState): { default: string; template: string } {
  return { default: envTitle(title, env), template: envTitle("%s", env) };
}
