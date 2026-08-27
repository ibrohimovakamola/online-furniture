import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Image as ImageIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

const TOOLBAR = [
  { cmd: 'bold', icon: Bold, label: 'Bold' },
  { cmd: 'italic', icon: Italic, label: 'Italic' },
  { cmd: 'underline', icon: Underline, label: 'Underline' },
  { cmd: 'strikeThrough', icon: Strikethrough, label: 'Strikethrough' },
  { type: 'sep' },
  { cmd: 'h1', icon: Heading1, label: 'Heading 1' },
  { cmd: 'h2', icon: Heading2, label: 'Heading 2' },
  { cmd: 'h3', icon: Heading3, label: 'Heading 3' },
  { type: 'sep' },
  { cmd: 'ul', icon: List, label: 'Bullet list' },
  { cmd: 'ol', icon: ListOrdered, label: 'Numbered list' },
  { type: 'sep' },
  { cmd: 'justifyLeft', icon: AlignLeft, label: 'Align left' },
  { cmd: 'justifyCenter', icon: AlignCenter, label: 'Align center' },
  { cmd: 'justifyRight', icon: AlignRight, label: 'Align right' },
  { type: 'sep' },
  { cmd: 'link', icon: LinkIcon, label: 'Link' },
  { cmd: 'image', icon: ImageIcon, label: 'Image' },
  { cmd: 'hr', icon: Minus, label: 'Divider' },
  { cmd: 'quote', icon: Quote, label: 'Quote' },
  { cmd: 'code', icon: Code, label: 'Code block' },
  { type: 'sep' },
  { cmd: 'undo', icon: Undo2, label: 'Undo' },
  { cmd: 'redo', icon: Redo2, label: 'Redo' },
]

/**
 * Lightweight HTML editor used by Blog + CMS Pages.
 * Stores HTML for existing storefront `dangerouslySetInnerHTML` rendering.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write content…',
  minHeight = 220,
}) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
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

    if (cmd === 'h1' || cmd === 'h2' || cmd === 'h3') {
      document.execCommand('formatBlock', false, cmd)
    } else if (cmd === 'ul') {
      document.execCommand('insertUnorderedList')
    } else if (cmd === 'ol') {
      document.execCommand('insertOrderedList')
    } else if (cmd === 'link') {
      const url = window.prompt('Link URL')
      if (url) document.execCommand('createLink', false, url)
    } else if (cmd === 'image') {
      const url = window.prompt('Image URL')
      if (url) document.execCommand('insertImage', false, url)
    } else if (cmd === 'hr') {
      document.execCommand('insertHorizontalRule')
    } else if (cmd === 'quote') {
      document.execCommand('formatBlock', false, 'blockquote')
    } else if (cmd === 'code') {
      document.execCommand('formatBlock', false, 'pre')
    } else if (cmd === 'undo' || cmd === 'redo') {
      document.execCommand(cmd)
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
        {TOOLBAR.map((item, idx) =>
          item.type === 'sep' ? (
            <span
              key={`sep-${idx}`}
              className="mx-1 w-px self-stretch bg-[var(--admin-border)]"
              aria-hidden
            />
          ) : (
            <button
              key={item.cmd}
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--icon h-8 w-8"
              onMouseDown={(e) => {
                e.preventDefault()
                exec(item.cmd)
              }}
              aria-label={item.label}
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </button>
          )
        )}
      </div>
      <div
        ref={editorRef}
        className="admin-rich-editor__body max-h-[560px] overflow-y-auto px-4 py-3 text-sm text-[var(--admin-text)] prose prose-sm max-w-none focus:outline-none [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_img]:max-w-full [&_img]:rounded-lg"
        style={{ minHeight }}
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
