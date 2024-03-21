import { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import '@ember/object/compat';

class Foo {
  @attr('string') declare bar: string;

  @computed('bar')
  get aliasBar() {
    return this.bar;
  }
}
