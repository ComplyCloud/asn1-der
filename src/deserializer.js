import {
  Deserializer,
} from '@complyify/asn1';

export class DERDeserializer extends Deserializer {

  deserializationImpl(der) { // eslint-disable-line no-unused-vars, class-methods-use-this, because placeholder
    throw new Error('DER deserialization unimplemented');
  }

}

export class PEMDeserializer extends Deserializer {

  deserializationImpl(pem) { // eslint-disable-line no-unused-vars, class-methods-use-this, because placeholder
    throw new Error('PEM deserialization unimplemented');
  }

}
