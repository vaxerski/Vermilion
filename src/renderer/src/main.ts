import { mount } from 'svelte'

import './assets/base.css'
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import '@fortawesome/fontawesome-free/css/brands.min.css'
import '@fortawesome/fontawesome-free/css/solid.min.css'

import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!
})

export default app
