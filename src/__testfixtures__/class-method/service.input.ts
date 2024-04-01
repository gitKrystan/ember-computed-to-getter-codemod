import { computed } from '@ember/object';
import { service } from '@ember/service';

class Foo {
  @service declare bar: string;

  @computed('bar')
  get aliasBar() {
    return this.bar;
  }

  @computed('bar', 'aliasBar')
  get aliasAliasBar() {
    return this.bar && this.aliasBar;
  }
}
