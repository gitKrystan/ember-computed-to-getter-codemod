import { API, FileInfo } from 'jscodeshift';

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const variableDeclarators = root.findVariableDeclarators('hello');
  variableDeclarators.renameTo('world');

  return root.toSource();
}
