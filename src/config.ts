import type { DXConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: DXConfig = {
  verbose: true,
}

let _config: DXConfig | null = null

export async function getConfig(): Promise<DXConfig> {
  if (!_config) {
    _config = await loadConfig({
  name: 'development',
  alias: 'dx',
  defaultConfig,
})
  }
  return _config
}

// For backwards compatibility - synchronous access with default fallback
export const config: DXConfig = defaultConfig
