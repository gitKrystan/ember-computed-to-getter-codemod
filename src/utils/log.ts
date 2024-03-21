import type { Options } from 'jscodeshift';

class Logger {
  private options: Options = {};

  config(options: Options): void {
    this.options = options;
  }

  warn(...args: any[]): void {
    console.warn(...args);
  }

  debug(...args: any[]): void {
    if (this.options.verbose === '2') {
      console.log(...args);
    }
  }
}

export const logger = new Logger();
