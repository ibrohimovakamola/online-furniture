/** Build i18next resources from locales/{lng}/{namespace}.json via Vite glob */
function fileNameToNamespace(file) {
  return file.replace(/\.json$/i, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

export function buildI18nResources() {
  const modules = import.meta.glob('../locales/*/*.json', { eager: true })
  const resources = {}

  for (const path of Object.keys(modules)) {
    const match = path.match(/locales\/([^/]+)\/([^/]+)\.json$/i)
    if (!match) continue
    const [, lng, file] = match
    const ns = fileNameToNamespace(file)
    if (!resources[lng]) resources[lng] = {}
    resources[lng][ns] = modules[path].default || modules[path]
  }

  return resources
}

export const I18N_NAMESPACES = [
  'common',
  'navigation',
  'frontend',
  'admin',
  'adminProducts',
  'adminBlog',
  'adminOrders',
  'adminCustomers',
  'adminUsers',
  'adminSettings',
  'validation',
  'errors',
  'success',
  'email',
]
