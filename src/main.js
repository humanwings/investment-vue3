import { createApp } from 'vue'

import App from './App.vue'
import elementPlus from './plugins/element-plus'
import router from './router'
import pinia from './stores'
import './permission'
import './styles/index.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(elementPlus)
app.mount('#app')
