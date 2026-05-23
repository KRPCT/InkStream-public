import type { PandocExportOptions, PandocImportOptions, PandocJobResult, PandocProbeResult } from '@/types';
import { invokeBackend } from './tauri';

export async function pandocProbe(path?: string): Promise<PandocProbeResult> {
  try {
    return await invokeBackend<PandocProbeResult>('pandoc_probe', { path });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function pandocExport(options: PandocExportOptions): Promise<PandocJobResult> {
  try {
    return await invokeBackend<PandocJobResult>('pandoc_export', { options });
  } catch (error) {
    return {
      ok: false,
      outputPath: options.outputPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function pandocImport(options: PandocImportOptions): Promise<PandocJobResult> {
  try {
    return await invokeBackend<PandocJobResult>('pandoc_import', { options });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
