#!/usr/bin/env bun
import { Option, program } from 'commander';
import { globbySync } from 'globby';
import jscodeshift from 'jscodeshift';
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import transformer from '../../src/index.js';

// Convert the URL of the current module to a file path.
const __filename = fileURLToPath(import.meta.url);
// Use dirname to get the directory path of the current module.
const __dirname = dirname(__filename);

function run(pathGlob, options) {
  const paths = globbySync(pathGlob);
  const transformPath = resolve(__dirname, '../src/index.ts');
  if (options.verbose === '2') {
    console.log('transformPath', transformPath);
    console.log('paths', paths);
    console.log('options', options);
  }
  for (const filePath of paths) {
    console.log('Running transform on file:', filePath);
    const srcCode = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const collection = jscodeshift(srcCode);
    const result = transformer(collection, jscodeshift, options);
    fs.writeFileSync(filePath, result, { encoding: 'utf-8' });
  }
  if (options.verbose === '2') {
    console.log('done');
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

program.parse(process.argv);
