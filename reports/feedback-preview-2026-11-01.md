# Temporary feedback preview — 1 November 2026

Superseded by the [independently hosted Railway preview](https://shielded-labs-portal-preview.up.railway.app). The tunnel was stopped at 19:42 UTC on 1 November 2026; the local development server was retained. See `hosted-preview-2026-11-01.md` for the new deployment.

Public URL: https://oscar-calendar-absent-sized.trycloudflare.com

Created at the user's request to share the point-zero prototype with Shielded Labs. The URL exposes only the optimized portal running at `http://127.0.0.1:4248`. It is an account-free Cloudflare Quick Tunnel, not a permanent deployment. Anyone with the URL can open it; no access password or guaranteed expiration date was configured. Availability requires the Mac, network, local server and tunnel to remain running. Restarting the tunnel generates a new address.

## Feedback mode

- Small “Prototype · For feedback only” notice in the shared page layout, also visible on mobile.
- Contact form remains testable but does not send requests or report delivery. The server API also refuses direct submissions with HTTP 403 and `sent: false`.
- Existing noindex/nofollow and security headers retained.
- No messages sent to Shielded Labs, no permanent domain configured, no GitHub publication or commit performed in this step.

## Validation

- Feedback production build, lint, typecheck and repository isolation passed; diff whitespace check clean.
- Nine targeted contact/controller and API tests passed, including the feedback guard and normal contact mode.
- Public root and activity, governance and editorial APIs returned HTTP 200 with valid payloads. Evidence: `feedback-preview-http-2026-11-01.json`.
- Public Contact API returned HTTP 403 as intended.
- Browser: Overview → Governance → Contact → Overview works over the public URL. Test form reports that no message was sent. No console errors observed.
- Desktop and 375px mobile layout inspected. No horizontal page overflow; notice is readable in both.
- Screenshots saved in the Codex visualization directory as `feedback-preview-public.png` and `feedback-preview-mobile.png`.

## Running processes and recovery

- Portal: `npm run start:feedback`, exec session `9253`.
- Tunnel: exec session `43271`; binary, release metadata, PID and log are in `/private/tmp/shielded-feedback/`.
- Cloudflared official release `2026.10.7`, Darwin arm64. Downloaded archive SHA-256 verified against GitHub asset digest: `3586ccf397e98e5f437e60e7c307ca6ac463e110580503af8bb8e6f9ebf831bd`.
- Tunnel command: `/private/tmp/shielded-feedback/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:4248 --pidfile /private/tmp/shielded-feedback/tunnel.pid --logfile /private/tmp/shielded-feedback/tunnel.log`.
- Stop sharing with Ctrl-C in the tunnel session; the local preview can remain running. No system service or startup item was installed.
- To recreate after a stop: build with `npm run build:feedback`, start with `npm run start:feedback`, then run the tunnel command and read its new URL. Stop any existing portal server before rebuilding.

Reference: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
