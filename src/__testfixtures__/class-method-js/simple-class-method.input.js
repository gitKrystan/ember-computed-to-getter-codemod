import { computed } from '@ember/object';
import { attr } from '@ember-data/model';

class Foo {
  @attr('string') bar;

  @computed('bar')
  get aliasBar() {
    return this.bar;
  }
}
