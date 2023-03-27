const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const config = fs.readFileSync(path.join(__dirname, './config.yaml'), 'utf8');
console.log(JSON.stringify(YAML.parse(config)));

