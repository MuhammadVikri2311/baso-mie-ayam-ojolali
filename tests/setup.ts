// Setup file untuk testing environment Vitest

const storage: Record<string, string> = {}

const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = String(value)
  },
  removeItem: (key: string) => {
    delete storage[key]
  },
  clear: () => {
    for (const k in storage) delete storage[k]
  },
  key: (i: number) => Object.keys(storage)[i] ?? null,
  get length() {
    return Object.keys(storage).length
  },
} as Storage

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = mockLocalStorage
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: mockLocalStorage,
  } as unknown as Window & typeof globalThis
}
