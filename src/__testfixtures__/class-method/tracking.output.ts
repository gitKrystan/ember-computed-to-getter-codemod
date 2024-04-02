import Bar from './bar';

import { cached } from '@glimmer/tracking';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo extends Bar {
  untracked = 'untracked';

  @cached
  @dependentKeyCompat
  get aliasUntracked() {
    return this.untracked;
  }

  get uncompatGetter() {
    return 'oh no';
  }

  @cached
  @dependentKeyCompat
  get aliasUncompatGetter() {
    return this.uncompatGetter;
  }

  @cached
  @dependentKeyCompat
  get aliasUnknown() {
    return this.unknown;
  }
}
