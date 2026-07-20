import '@testing-library/jest-dom'

if (typeof window !== 'undefined') {
  // jsdom doesn't implement scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = jest.fn()

  // jsdom doesn't implement SpeechSynthesis
  Object.defineProperty(window, 'speechSynthesis', {
    value: { speak: jest.fn(), cancel: jest.fn(), getVoices: () => [] },
    writable: true,
  })
}
