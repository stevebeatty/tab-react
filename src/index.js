import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import { App } from './js/cmp/App';
import registerServiceWorker from './registerServiceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import 'jquery/dist/jquery.slim.min.js'
import 'popper.js/dist/popper.min.js'
import 'bootstrap/dist/js/bootstrap.min.js'

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
