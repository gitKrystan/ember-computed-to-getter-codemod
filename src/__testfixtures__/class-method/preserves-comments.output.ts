import { attr } from '@ember-data/model';

import { cached } from '@glimmer/tracking';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') declare bar: string;

  // Decorator leading
  // Decorator inline
  // Decorator trailing / ClassMethod leading
  @cached
  @dependentKeyCompat
  get aliasBar() {
    // Within ClassMethod
    return this.bar;
  }
  // ClassMethod trailing
}
