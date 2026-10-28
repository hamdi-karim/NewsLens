interface ImportMetaEnv {
  // "true" serves /api/* from MSW fixtures in dev (no real API calls). Not a secret.
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
