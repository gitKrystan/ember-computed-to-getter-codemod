import { attr } from '@ember-data/model';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') bar;

  // Decorator leading
  @dependentKeyCompat // Decorator inline
  // Decorator trailing / ClassMethod leading
  get aliasBar() {
    // Within ClassMethod
    return this.bar;
  }
  // ClassMethod trailing
}
