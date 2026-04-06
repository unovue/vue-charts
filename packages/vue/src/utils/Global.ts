export type GlobalConfigKeys = 'isSsr'

export interface GlobalConfig {
  isSsr?: boolean
}

function parseIsSsrByDefault(): boolean {
  return typeof window === 'undefined'
}

export const Global = {
  isSsr: parseIsSsrByDefault(),

  get(key: GlobalConfigKeys) {
    return Global[key]
  },

  set(key: GlobalConfigKeys | GlobalConfig, value?: any) {
    if (typeof key === 'string') {
      Global[key] = value
    }
    else {
      const keys = Object.keys(key) as GlobalConfigKeys[]
      keys.forEach((k) => {
        Global[k] = key[k] as boolean
      })
    }
  },
}
