import { computed } from 'somewhere-else';
import { attr } from '@ember-data/model';

class Foo {
  @attr('string') declare bar: string;

  @computed('bar')
  get aliasBar() {
    return this.bar;
  }
}
