import { invoke } from '@tauri-apps/api/core';

const BACKEND_UNAVAILABLE = 'Tauri backend unavailable in browser preview';

export async function invokeBackend<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error(BACKEND_UNAVAILABLE);
  }
  return invoke<T>(command, args);
}

export function isBackendUnavailable(error: unknown): boolean {
  return error instanceof Error && error.message === BACKEND_UNAVAILABLE;
}

function isTauriRuntime(): boolean {
  return Boolean((globalThis as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
}
