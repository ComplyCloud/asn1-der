import { InvalidASN1ObjectModelError } from '@complyify/asn1';
import { expect } from 'chai';
import { inspect } from 'util';

import resources from './resources';

import { DERSerializer, PEMSerializer } from '../src';

[
  { name: 'der', serializer: DERSerializer },
  { name: 'pem', serializer: PEMSerializer },
].forEach(({ name, serializer: Serializer }) => {
  describe(`${name.toUpperCase()} serialization`, function () {

    const serialize = new Serializer();

    /* should throw InvalidContentError if passed null, empty, function, or 0 */
    [undefined, null, '', [], () => {}, 0].forEach((invalidContent) => {
      const expectedErr = InvalidASN1ObjectModelError;
      it(`should throw ${expectedErr.name} when serializing ${inspect(invalidContent)}`, function () {
        const serializeInvalidContent = () => serialize(invalidContent);
        expect(serializeInvalidContent).to.throw(expectedErr);
      });
    });

    Object.keys(resources).forEach((resourceName) => {
      const resource = resources[resourceName];
      const expected = resource[name];
      if (expected) {
        it(`should return the expected content when serializing ${resourceName}`, function () {
          this.timeout(5000);
          const actual = serialize(resource.object, { schema: resource.schema });
          expect(actual).to.deep.equal(expected);
        });
      }
    });

  });

});
