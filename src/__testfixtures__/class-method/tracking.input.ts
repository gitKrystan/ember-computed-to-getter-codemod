import { computed } from '@ember/object';
import Bar from './bar';

class Foo extends Bar {
  untracked = 'untracked';

  @computed('untracked')
  get aliasUntracked() {
    return this.untracked;
  }

  get uncompatGetter() {
    return 'oh no';
  }

  @computed('uncompatGetter')
  get aliasUncompatGetter() {
    return this.uncompatGetter;
  }

  @computed('unknown')
  get aliasUnknown() {
    return this.unknown;
  }
}
