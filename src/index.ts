import type { API, Collection, FileInfo, Options } from 'jscodeshift';
import {
  addDependentKeyCompatImport,
  removeComputedSpecifier,
} from './utils/imports';
import { transformComputedClassMethods } from './utils/class-method';
import { transformComputedClassProperties } from './utils/class-property';

export default function transformer(
  fileOrCollection: FileInfo | Collection,
  api: API,
  options: Options,
) {
  const j = api.jscodeshift;
  // HACKS so I don't have to rewrite the tests
  const root =
    'source' in fileOrCollection
      ? j(fileOrCollection.source)
      : fileOrCollection;

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
