import fs from 'node:fs';
import path from 'node:path';
import { defineTest } from 'jscodeshift/src/testUtils';

function findAllTestFixturesSync(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach((file) => {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findAllTestFixturesSync(filePath, fileList);
    } else if (file.isFile() && file.name.endsWith('.input.ts')) {
      fileList.push(filePath);
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

  const testsByCategory = inputFiles.reduce<Record<string, string[]>>(
    (acc, filePath) => {
      const relativePath = path.relative(fixturesPath, filePath);
      const category = relativePath.split(path.sep).slice(0, -1).join(path.sep);
      const testName = path.basename(relativePath).replace('.input.ts', '');
      const fullPath = `${category}/${testName}`;

      // If `only` is specified and does not match the current path, skip adding this test
      if (only && only !== fullPath) {
        return acc;
      }

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(testName);
      return acc;
    },
    {},
  );

  Object.entries(testsByCategory).forEach(([category, tests]) => {
    describe(category.replace(path.sep, ' > '), () => {
      tests.forEach((testName) => {
        defineTest(__dirname, './index', null, `${category}/${testName}`, {
          parser: 'ts',
        });
      });
    });
  });
}

// prettier-ignore
runTests(
  // Uncomment to test only a specific fixture
  // { only: 'class-property/simple-class-method' },
);
