import type { SupabaseClient } from "@supabase/supabase-js";

// Shared by timeline and journal actions — both attach at most one photo
// per entry, already compressed to JPEG client-side.
export async function uploadPhoto(supabase: SupabaseClient, coupleId: string, file: File): Promise<string | null> {
  const path = `${coupleId}/${crypto.randomUUID()}.jpg`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from("photos").upload(path, bytes, { contentType: "image/jpeg" });
  if (error) {
    console.error("Photo upload failed:", error.message, { path, size: file.size, type: file.type });
    return null;
  }
  return path;
}

// Batch-signs every photo path a page needs in one round trip, rather than
// one createSignedUrl call per entry.
export async function getPhotoUrls(supabase: SupabaseClient, paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data } = await supabase.storage.from("photos").createSignedUrls(paths, 3600);
  const entries: [string, string][] = [];
  for (const d of data ?? []) {
    if (d.path && d.signedUrl) entries.push([d.path, d.signedUrl]);
  }
  return new Map(entries);
}
