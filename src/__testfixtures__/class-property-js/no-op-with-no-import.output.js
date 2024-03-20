import { computed } from 'somewhere-else';
import { attr } from '@ember-data/model';

class Foo {
  @attr('string') bar;

  @computed('bar', function () {
    return this.bar;
  })
  aliasBar;
}
