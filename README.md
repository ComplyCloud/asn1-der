# @complyify/asn1-der

Javascript library for DER and PEM serialization/deserialization of Abstract Syntax Notation One (ASN.1)

Uses the ASN.1 Object Model from [@complyify/asn1].

*Currently only DER serialization is supported. Deserialization coming soon.*

## Installation

`npm install @complyify/asn1-der`

## Usage

```javascript
import { Universal } from '@complyify/asn1';
import { DERSerializer } from '@complyify/asn1-der';
import { readFileSync } from 'fs';

// Serialize to DER
const serialize = new DERSerializer();
const asn1Sequence = new Universal.Sequence([
  new Universal.Integer(123),
  new Universal.PrintableString('Hello World'),
]);
const bufferContainingDEREncodedASN1 = serialize(asn1Sequence);

// Deserialize from PEM
const deserialize = new PEMDeserializer();
const certificate = readFileSync('/path/to/some/certificate.pem', 'utf8');
const certificateASN1 = deserialize(certificate);
```

## Debugging

This library uses the [@complyify/debug] library for debugging. To enable debug messages, simply set the `DEBUG`
environment variable.

```shell
# enable all debugging messages in this library
DEBUG=complyify:asn1:der:* <your-exec-here>
```

[@complyify/asn1]: https://github.com/complyify/asn1
[@complyify/debug]: https://github.com/complyify/debug
