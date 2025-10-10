import type { DXConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: DXConfig = {
  verbose: true,
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: DXConfig = await loadConfig({
  name: 'development',
  alias: 'dx',
  defaultConfig,
})
