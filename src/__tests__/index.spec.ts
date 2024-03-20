import fs from 'node:fs';
import path from 'node:path';
import { defineTest } from 'jscodeshift/src/testUtils';

function findAllTestFixturesSync(
  dir: string,
  fileList: Array<{ filePath: string; ext: string }> = [],
) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach((file) => {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findAllTestFixturesSync(filePath, fileList);
    } else if (
      file.isFile() &&
      (file.name.endsWith('.input.ts') || file.name.endsWith('.input.js'))
    ) {
      fileList.push({ filePath, ext: path.extname(file.name) });
    }
  });
  return fileList;
}

interface RunTestsOptions {
  only?: string;
}

function runTests({ only }: RunTestsOptions = {}) {
  const fixturesPath = path.join(__dirname, '..', '__testfixtures__');
  const inputFiles = findAllTestFixturesSync(fixturesPath);

  const testsByCategory = inputFiles.reduce<
    Record<string, Array<{ testName: string; ext: string }>>
  >((acc, { filePath, ext }) => {
    const relativePath = path.relative(fixturesPath, filePath);
    const category = relativePath.split(path.sep).slice(0, -1).join(path.sep);
    const testName = path
      .basename(relativePath)
      .replace('.input.ts', '')
      .replace('.input.js', '');
    const fullPath = `${category}/${testName}`;

    if (only && only !== fullPath) {
      return acc;
    }

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ testName, ext });
    return acc;
  }, {});

  Object.entries(testsByCategory).forEach(([category, tests]) => {
    describe(category.replace(path.sep, ' > '), () => {
      tests.forEach(({ testName, ext }) => {
        defineTest(__dirname, './index', null, `${category}/${testName}`, {
          parser: ext === '.ts' ? 'ts' : 'babel',
        });
      });
    });
  });
}

// prettier-ignore
runTests(
  // Uncomment to test only a specific fixture
  // { only: 'class-method/preserves-comments' },
);
