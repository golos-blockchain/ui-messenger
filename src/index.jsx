import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'
import { addShortcut } from 'app/utils/app/ShortcutUtils'

// First add - for case if all failed at all, and not rendering Messages
if (process.env.IS_APP) {
    addShortcut({
        id: 'the_settings',
        shortLabel: 'Настройки',
        longLabel: 'Settings',
        hash: '#app-settings'
    })
}

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
)
