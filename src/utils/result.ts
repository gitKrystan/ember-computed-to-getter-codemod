import type { Import } from './imports';

export class TransformResult {
  importsToAdd = new Set<Import>();

  merge(other: TransformResult): void {
    other.importsToAdd.forEach((importToAdd) =>
      this.importsToAdd.add(importToAdd),
    );
  }
}
