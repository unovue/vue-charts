import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VccsResolver } from 'vccs/resolver'

// App.vue uses <CartesianGrid> without importing it; the resolver supplies the import.
export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VccsResolver()], dts: 'src/components.d.ts' })],
})
