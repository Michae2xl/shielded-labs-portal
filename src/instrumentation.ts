/**
 * A fresh server reads the poll's turnout once on its own, so the first visitor after a deploy does not wait
 * while the vote chain's history is read. It asks its own route, which keeps what it read for everyone.
 */
const ATTEMPTS = 5;
const DELAY = 5_000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.SHIELDED_LABS_PREVIEW !== '1' || !process.env.PORT) return;
  const url = `http://127.0.0.1:${process.env.PORT}/api/shielded-preview/turnout`;
  const warm = async (attempt: number) => {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(120_000) });
      if (response.ok) return;
    } catch {
      // The server may not be listening yet: try again shortly.
    }
    if (attempt < ATTEMPTS) setTimeout(() => void warm(attempt + 1), DELAY);
  };
  setTimeout(() => void warm(1), DELAY);
}
