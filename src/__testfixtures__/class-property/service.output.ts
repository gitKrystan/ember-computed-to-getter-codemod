import { service } from '@ember/service';

import { cached } from '@glimmer/tracking';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo {
  @service declare bar: string;

  @cached
  get aliasBar() {
    return this.bar;
  }@dependentKeyCompat
  get aliasAliasBar() {
    return this.bar && this.aliasBar;
  }
}
