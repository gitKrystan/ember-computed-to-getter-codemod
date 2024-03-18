import type { API, FileInfo } from 'jscodeshift';
import {
  addDependentKeyCompatImport,
  removeComputedSpecifier,
} from './utils/imports';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const hadComputedSpecifier = removeComputedSpecifier(j, root);

  if (hadComputedSpecifier) {
    addDependentKeyCompatImport(j, root);
  }

  // TODO: Make quote configurable or pull from prettierrc
  return root.toSource({ quote: 'single' });
}
