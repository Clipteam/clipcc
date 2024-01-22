// Polyfills
import 'es6-object-assign/auto';
import 'core-js/fn/array/includes';
import 'core-js/fn/promise/finally';
import 'intl'; // For Safari 9

import {addWebComponent} from '../';
import styles from './index.css';

addWebComponent();
const gui = document.createElement('clipcc-gui');
gui.setAttribute('can-edit-title', 'true');
const button = document.createElement('button');
button.innerHTML = 'Change canEditTitle';
button.onclick = function () {
    const status = gui.getAttribute('can-edit-title');
    gui.setAttribute('can-edit-title', status !== 'true');
}
document.body.appendChild(button);
document.body.appendChild(gui);
