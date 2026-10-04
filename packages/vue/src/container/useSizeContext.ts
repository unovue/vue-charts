import type { Ref } from 'vue'
import { createContext } from '../utils/createContext'
import type { RoundedSize } from '@/hooks/useRoundedSize'

const [useInitialDimension, provideInitialDimension] = createContext<Ref<RoundedSize | undefined>>('InitialDimension')

export { provideInitialDimension, useInitialDimension }
