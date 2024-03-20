import type { API, FileInfo, Options } from 'jscodeshift';
import {
  addDependentKeyCompatImport,
  removeComputedSpecifier,
} from './utils/imports';
import { transformComputedClassMethods } from './utils/class-method';
import { transformComputedClassProperties } from './utils/class-property';

export default function transformer(
  file: FileInfo,
  api: API,
  options: Options,
) {
  if (options.verbose === '2') {
    console.log('Running transform on file:', file.path);
  }
  const j = api.jscodeshift;
  const root = j(file.source);

  const removedComputedName = removeComputedSpecifier(j, root);

  if (removedComputedName) {
    if (options.verbose === '2') {
      console.log('removedComputedName', removedComputedName);
      console.log('adding dependentKeyCompat import');
    }
    addDependentKeyCompatImport(j, root);
    if (options.verbose === '2') {
      console.log('transforming computed class methods');
    }
    transformComputedClassMethods(j, root, removedComputedName);
    if (options.verbose === '2') {
      console.log('transforming computed class properties');
    }
    transformComputedClassProperties(j, root, removedComputedName);
  }

  // TODO: Make quote configurable or pull from prettierrc
  return root.toSource({ quote: 'single' });
}
