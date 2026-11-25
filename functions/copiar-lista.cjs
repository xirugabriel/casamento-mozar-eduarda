// predeploy (firebase.json): o servidor cobra pela mesma lista de presentes do site
const path = require('path');
require('fs').copyFileSync(path.join(__dirname, '..', 'js', 'data.js'), path.join(__dirname, 'data.js'));
