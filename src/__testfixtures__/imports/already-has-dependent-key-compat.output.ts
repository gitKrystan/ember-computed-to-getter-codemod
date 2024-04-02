import { attr } from '@ember-data/model';
import { dependentKeyCompat } from '@ember/object/compat';
import { cached } from '@glimmer/tracking';

class Foo {
  @attr('string') declare bar: string;

  @cached
  @dependentKeyCompat
  get aliasBar() {
    return this.bar;
  }

  @dependentKeyCompat
  get aliasBar2() {
    return this.bar;
  }
}
