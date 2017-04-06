import { readdirSync, readFileSync } from 'fs';
import { basename, join } from 'path';

const thisFileName = basename(__filename);

const fileProcessors = [
  {
    pattern: /^(.+?)\.der$/i,
    parameter: 'der',
    process: file => readFileSync(file),
  },
  {
    pattern: /^(.+?)\.pem$/i,
    parameter: 'pem',
    process: file => readFileSync(file, 'utf8'),
  },
  {
    pattern: /^(.+?)\.js$/i,
    parameter: 'object',
    process: file => require(file).default, // eslint-disable-line global-require, import/no-dynamic-require
  },
  {
    pattern: /^(.+?)\.schema$/i,
    parameter: 'schema',
    process: file => readFileSync(file, 'utf8').trim(),
  },
];

const resources = {};

function importResource(file) {
  fileProcessors.some(({ pattern, parameter, process }) => {
    const [, fileName] = pattern.exec(file) || [];
    if (!fileName) return false;
    if (!resources[fileName]) resources[fileName] = {};
    resources[fileName][parameter] = process(join(__dirname, file));
    return true;
  });
}

readdirSync(__dirname).filter(file => file !== thisFileName).forEach(importResource);

export default resources;
