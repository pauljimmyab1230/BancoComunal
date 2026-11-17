import '@testing-library/jest-dom/vitest'

// jsdom no implementa matchMedia; lo necesita el store de tema al importar componentes.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (consulta: string) => ({
      matches: false,
      media: consulta,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
