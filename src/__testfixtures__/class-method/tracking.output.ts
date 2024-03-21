import Bar from './bar';
import { dependentKeyCompat } from '@ember/object/compat';

class Foo extends Bar {
  untracked = 'untracked';

  @dependentKeyCompat
  get aliasUntracked() {
    return this.untracked;
  }

  get uncompatGetter() {
    return 'oh no';
  }

  @dependentKeyCompat
  get aliasUncompatGetter() {
    return this.uncompatGetter;
  }

  @dependentKeyCompat
  get aliasUnknown() {
    return this.unknown;
  }
}
