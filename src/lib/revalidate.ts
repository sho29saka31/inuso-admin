export async function revalidateViewer(paths: string[]): Promise<void> {
  const url = process.env.VIEWER_REVALIDATE_URL;
  const secret = process.env.VIEWER_REVALIDATE_SECRET;
  if (!url || !secret) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, paths }),
  }).catch(() => {});
}
