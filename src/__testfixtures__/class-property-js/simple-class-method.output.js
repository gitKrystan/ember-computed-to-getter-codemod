import { attr } from '@ember-data/model';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') bar;

  @dependentKeyCompat
  get aliasBar() {
    return this.bar;
  }
}
