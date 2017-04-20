import { expect } from 'chai';
import { inspect } from 'util';

import resources from './resources';

import { DERDeserializer, IllegalContentError, PEMDeserializer } from '../src';

function compare(a, b) {
  if (a === b) return true;
  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) throw new Error('array length mismatch');
      for (let i = 0; i < a.length; i += 1) {
        compare(a[i], b[i]);
      }
      return true;
    }
    Object.keys(a).forEach((key) => {
      compare(a[key], b[key]);
    });
    return true;
  }
  throw new Error('type mismatch');
}

[
  { name: 'der', deserializer: DERDeserializer },
  { name: 'pem', deserializer: PEMDeserializer },
].forEach(({ name, deserializer: Deserializer }) => {
  describe(`${name.toUpperCase()} deserialization`, function () {

    const deserialize = new Deserializer();

    /* should throw InvalidContentError if passed null, empty, function, or 0 */
    [undefined, null, '', [], () => {}, 0, new Buffer(0)].forEach((invalidContent) => {
      const expectedErr = IllegalContentError;
      it(`should throw ${expectedErr.name} when deserializing ${inspect(invalidContent)}`, function () {
        const deserializeInvalidContent = () => deserialize(invalidContent);
        expect(deserializeInvalidContent).to.throw(expectedErr);
      });
    });

    Object.keys(resources).forEach((resourceName) => {
      const resource = resources[resourceName];
      const serialized = resource[name];
      const expected = resource.object;
      if (serialized) {
        it(`should return the expected ASN.1 object model when deserializing ${resourceName}`, function () {
          this.timeout(5000);
          const actual = deserialize(serialized);
          expect(compare(actual, expected)).to.equal(true);
        });
      }
    });

  });

});
