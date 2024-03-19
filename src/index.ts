import type { API, FileInfo } from 'jscodeshift';
import {
  addDependentKeyCompatImport,
  removeComputedSpecifier,
} from './utils/imports';
import { transformComputedClassMethods } from './utils/class-method';
import { transformComputedClassProperties } from './utils/class-property';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const removedComputedName = removeComputedSpecifier(j, root);

  if (removedComputedName) {
    addDependentKeyCompatImport(j, root);
    transformComputedClassMethods(j, root, removedComputedName);
    transformComputedClassProperties(j, root, removedComputedName);
  }

  // TODO: Make quote configurable or pull from prettierrc
  return root.toSource({ quote: 'single' });
}
