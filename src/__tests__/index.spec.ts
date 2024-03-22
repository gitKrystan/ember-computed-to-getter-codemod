import type { Options, Transform } from 'jscodeshift';
import { applyTransform, type TestOptions } from 'jscodeshift/src/testUtils';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/log';

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
      tests.forEach(({ testName }) => {
        defineTest(__dirname, './index', category, testName, null, {
          parser: 'ts',
        });
      });
    });
  });
}

function defineTest(
  dirName: string,
  transformName: string,
  category: string,
  fixturesPath: string,
  options?: Options | null,
  testOptions?: TestOptions,
): void {
  const testFilePrefix = `${category}/${fixturesPath}`;
  const testName = testFilePrefix
    ? `transforms correctly using "${testFilePrefix}" data`
    : 'transforms correctly';
  describe(transformName, () => {
    it(testName, () => {
      runTest(
        dirName,
        transformName,
        category,
        fixturesPath,
        options,
        testOptions,
      );
    });
  });
}

function runTest(
  dirName: string,
  transformName: string,
  category: string,
  fixturesPath: string,
  options?: Options | null,
  testOptions: TestOptions = {},
): void {
  const realLoggerWarn = logger.warn;
  const logs: Array<unknown[]> = [];
  logger.warn = (...args) => {
    logs.push(['warn', ...args]);
  };

  const testFilePrefix = `${category}/${fixturesPath}`;

  // Assumes transform is one level up from __tests__ directory
  const module = require(path.join(dirName, '..', transformName));
  const extension = extensionForParser(testOptions.parser || module.parser);
  const fixtureDir = path.join(dirName, '..', '__testfixtures__');
  const inputPath = path.join(
    fixtureDir,
    testFilePrefix + `.input.${extension}`,
  );
  const source = fs.readFileSync(inputPath, 'utf8');
  const expectedOutput = fs.readFileSync(
    path.join(fixtureDir, testFilePrefix + `.output.${extension}`),
    'utf8',
  );
  runInlineTest(
    module,
    options ?? {},
    {
      path: inputPath,
      source,
    },
    expectedOutput,
    testOptions,
  );

  let info = '{}';
  try {
    info = fs.readFileSync(
      path.join(fixtureDir, testFilePrefix + `.info.json`),
      'utf8',
    );
  } catch {}

  const expectedLogs = JSON.parse(info).expectedLogs ?? [];
  expect(logs).toEqual(expectedLogs);

  logger.warn = realLoggerWarn;
}

// TODO: Fix js tests
function extensionForParser(parser: TestOptions['parser']) {
  switch (parser) {
    case 'ts':
    case 'tsx':
      return parser;
    default:
      return 'js';
  }
}

function runInlineTest(
  module:
    | {
        default: Transform;
        parser: TestOptions['parser'];
      }
    | Transform,
  options: Options,
  input: {
    path?: string;
    source: string;
  },
  expectedOutput: string,
  testOptions?: TestOptions,
) {
  const output = applyTransform(module, options, input, testOptions);
  expect(output).toEqual(expectedOutput.trim());
  return output;
}

// prettier-ignore
runTests(
  // Uncomment to test only a specific fixture
  // { only: 'class-method/tracking' },
);
