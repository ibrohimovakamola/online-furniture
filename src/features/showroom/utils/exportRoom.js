import html2canvas from 'html2canvas'

/**
 * Snapshot the room canvas (background + furniture layers) as a PNG download.
 * @param {HTMLElement} element
 * @param {string} [filename]
 */
export async function exportRoomAsPng(element, filename = 'kresla-room-preview.png') {
  if (!element) return

  const controls = element.querySelectorAll('[data-export-hide]')
  controls.forEach((node) => {
    node.dataset.exportPrevDisplay = node.style.display
    node.style.display = 'none'
  })

  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      logging: false,
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png', 1)
    link.click()
  } finally {
    controls.forEach((node) => {
      node.style.display = node.dataset.exportPrevDisplay || ''
      delete node.dataset.exportPrevDisplay
    })
  }
}
