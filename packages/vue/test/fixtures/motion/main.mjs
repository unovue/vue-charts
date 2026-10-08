import { createApp } from 'vue'
import App from './App.vue'
import { installMotionProbe } from './probe.mjs'

installMotionProbe()
createApp(App).mount('#app')
