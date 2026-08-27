import { CMS_LANGS, translationStatus } from './pageEditorUtils'

export default function PageLanguageTabs({ lang, translations, onChange }) {
  const statuses = translationStatus(translations)

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Page language"
    >
      {CMS_LANGS.map(({ code, label, flag }) => {
        const st = statuses.find((s) => s.code === code)
        const active = lang === code
        return (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={active}
            className={`admin-btn ${active ? 'admin-btn--primary' : 'admin-btn--ghost'} text-sm`}
            onClick={() => onChange(code)}
          >
            <span aria-hidden>{flag}</span>
            {label}
            <span
              className={`ml-1 text-xs ${st?.complete ? 'text-[var(--admin-success)]' : 'text-amber-400'}`}
              title={st?.complete ? 'Complete' : 'Missing translation'}
            >
              {st?.complete ? '✓' : '⚠'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
