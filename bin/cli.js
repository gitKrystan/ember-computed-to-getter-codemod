#!/usr/bin/env bun
import { program, Option } from 'commander';
import { globby } from 'globby';
import { run as jscodeshift } from 'jscodeshift/src/Runner.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Convert the URL of the current module to a file path.
const __filename = fileURLToPath(import.meta.url);
// Use dirname to get the directory path of the current module.
const __dirname = dirname(__filename);

async function run(filePath, options) {
  const paths = await globby(filePath);
  const transformPath = resolve(__dirname, '../src/index.ts');
  if (options.verbose === '2') {
    console.log('transformPath', transformPath);
    console.log('paths', paths);
  }
  const result = await jscodeshift(transformPath, paths, options);
  if (options.verbose === '2') {
    console.log('options', options);
    console.log('result', result);
  }
}

program
  .name('ember-computed-to-getter-codemod')
  .description(
    'CLI to run ember-computed-to-getter-codemod on specified files. See JSCodeshift documentation for additional options.',
  )
  .argument('<path>', 'Path to files or glob pattern')
  .addOption(
    new Option(
      '-v, --verbose <level>',
      'show more information about the transform process',
    )
      .choices(['0', '1', '2'])
      .default('0'),
  )
  .allowUnknownOption() // to passthrough jscodeshift options
  .action(run);

(async () => {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
