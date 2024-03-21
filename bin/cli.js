#!/usr/bin/env bun
import { Option, program } from 'commander';
import { globbySync } from 'globby';
import jscodeshift from 'jscodeshift';
import fs from 'node:fs';
import transformer from '../src/index.js';

function run(pathGlob, options) {
  const paths = globbySync(pathGlob);
  if (options.verbose === '2') {
    console.log('paths', paths);
    console.log('options', options);
  }
  for (const filePath of paths) {
    console.log('Running transform on file:', filePath);
    const srcCode = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const j = jscodeshift.withParser('ts');
    const collection = j(srcCode);
    const result = transformer(collection, { jscodeshift: j }, options);
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
