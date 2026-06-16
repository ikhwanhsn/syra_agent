/** Local-only post studio state types (no API persistence for S3 Labs). */
export interface PostStudioState {
  postedOnX: Record<string, boolean>;
  deleted: number[];
  updatedAt?: string | null;
}
