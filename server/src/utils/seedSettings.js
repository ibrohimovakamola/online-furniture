import { getOrCreateSettings } from './settingsHelper.js'

export async function seedSettings() {
  await getOrCreateSettings()
}
