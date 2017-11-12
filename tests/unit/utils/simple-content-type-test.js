import simpleContentType from 'inspektor/utils/simple-content-type';
import { module, test } from 'qunit';

module('Unit | Utility | simple content type');

test('it removes the charset portion', function(assert) {
  let type = 'application/json; charset=UTF-8';
  let result = simpleContentType(type);

  assert.equal(result, 'application/json');
});
