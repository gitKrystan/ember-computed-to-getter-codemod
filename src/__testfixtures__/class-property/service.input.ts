import { computed } from '@ember/object';
import { service } from '@ember/service';

class Foo {
  @service declare bar: string;

  @computed('bar', function () {
    return this.bar;
  })
  aliasBar;

  @computed('bar', 'aliasBar', function () {
    return this.bar && this.aliasBar;
  })
  aliasAliasBar;
}
