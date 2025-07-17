import {execSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {env} from 'node:process';

let version = env['VERSION'];
if (!version) {
  const tag = execSync('git tag --points-at HEAD').toString().trim();
  if (!tag) {
    version = 'snapshot';
  } else {
    version = tag;
  }
}

let commit = env['COMMIT'];
if (!commit) {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
}

const buildconfig = {version, commit, release: version !== 'snapshot'};

console.log(buildconfig);

await writeFile('projects/ui/src/buildconfig/version.json', JSON.stringify(buildconfig, null, 2));
