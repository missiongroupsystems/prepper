/**
 * The environment pill (0.133.0): a small fixed label in the top bar on every tier but production,
 * so nobody mistakes staging for the live system. Production renders NOTHING (no wrapper, no
 * placeholder), so the live bar's DOM and layout are exactly what they were before the badge.
 *
 * Hovering shows what the tier is and, on Vercel, the commit it was built from. No hooks and no
 * state, so it renders from a server or a client component alike; the host resolves `env` on the
 * server (`readAppEnv`) and passes it in, plus a `className` for where it sits in its own bar.
 */
import { type AppEnvState, ENV_BADGE } from "./env";

export function EnvBadge({
  env,
  build = null,
  className = "",
}: {
  env: AppEnvState;
  build?: string | null;
  /** Placement only (the host's bar decides where the pill sits); the colours are the tier's. */
  className?: string;
}) {
  if (env === "production") return null;
  const { label, description, className: tone } = ENV_BADGE[env];
  return (
    <span
      title={build ? `${description} · build ${build}` : description}
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium tracking-wide whitespace-nowrap ${tone} ${className}`}
    >
      {label}
    </span>
  );
}
