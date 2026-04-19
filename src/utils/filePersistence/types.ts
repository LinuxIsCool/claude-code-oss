export const OUTPUTS_SUBDIR = 'outputs'
export const FILE_COUNT_LIMIT = 200
export const DEFAULT_UPLOAD_CONCURRENCY = 4

export type PersistedFile = {
  path: string
  fileId: string
}

export type FailedPersistence = {
  path: string
  error: string
}

export type FilesPersistedEventData = {
  files: PersistedFile[]
  failed: FailedPersistence[]
}

export type TurnStartTime = number
