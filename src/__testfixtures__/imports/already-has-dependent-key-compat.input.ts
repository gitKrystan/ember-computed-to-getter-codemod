import { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @attr('string') declare bar: string;

  @computed('bar')
  get aliasBar() {
    return this.bar;
  }

  @dependentKeyCompat
  get aliasBar2() {
    return this.bar;
  }
}
