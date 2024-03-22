import { computed } from '@ember/object';
import Bar from './bar';

class Foo extends Bar {
  untracked = 'untracked';

  @computed('untracked', function () {
    return this.untracked;
  })
  aliasUntracked;

  get uncompatGetter() {
    return 'oh no';
  }

  @computed('uncompatGetter', function () {
    return this.uncompatGetter;
  })
  aliasUncompatGetter;

  @computed('unknown', function () {
    return this.unknown;
  })
  aliasUnknown;
}
