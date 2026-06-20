import { useCallback, useEffect, useRef } from 'react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading2,
  Code,
  Quote,
} from 'lucide-react'

const TOOLBAR = [
  { cmd: 'bold', icon: Bold, label: 'Bold' },
  { cmd: 'italic', icon: Italic, label: 'Italic' },
  { cmd: 'underline', icon: Underline, label: 'Underline' },
  { cmd: 'h2', icon: Heading2, label: 'Heading' },
  { cmd: 'ul', icon: List, label: 'Bullet list' },
  { cmd: 'ol', icon: ListOrdered, label: 'Numbered list' },
  { cmd: 'link', icon: LinkIcon, label: 'Link' },
  { cmd: 'quote', icon: Quote, label: 'Quote' },
  { cmd: 'code', icon: Code, label: 'Code' },
]

export default function RichTextEditor({ value, onChange, placeholder = 'Write content…' }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const emitChange = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const exec = (cmd) => {
    const el = editorRef.current
    if (!el) return
    el.focus()

    if (cmd === 'h2') {
      document.execCommand('formatBlock', false, 'h2')
    } else if (cmd === 'ul') {
      document.execCommand('insertUnorderedList')
    } else if (cmd === 'ol') {
      document.execCommand('insertOrderedList')
    } else if (cmd === 'link') {
      const url = window.prompt('Link URL')
      if (url) document.execCommand('createLink', false, url)
    } else if (cmd === 'quote') {
      document.execCommand('formatBlock', false, 'blockquote')
    } else if (cmd === 'code') {
      document.execCommand('formatBlock', false, 'pre')
    } else {
      document.execCommand(cmd)
    }
    emitChange()
  }

  return (
    <div className="admin-rich-editor rounded-xl border border-[var(--admin-border)] overflow-hidden bg-[var(--admin-bg-elevated)]">
      <div
        className="flex flex-wrap gap-1 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] p-2"
        role="toolbar"
        aria-label="Formatting"
      >
        {TOOLBAR.map(({ cmd, icon: Icon, label }) => (
          <button
            key={cmd}
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--icon h-8 w-8"
            onMouseDown={(e) => {
              e.preventDefault()
              exec(cmd)
            }}
            aria-label={label}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        className="admin-rich-editor__body min-h-[220px] max-h-[480px] overflow-y-auto px-4 py-3 text-sm text-[var(--admin-text)] prose prose-sm max-w-none focus:outline-none [&_h2]:text-lg [&_h2]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
      />
    </div>
  )
}
