# @complycloud/asn1-der

Javascript library for DER and PEM serialization/deserialization of Abstract Syntax Notation One (ASN.1)

Uses the ASN.1 Object Model from [@complycloud/asn1].

## Installation

`npm install @complycloud/asn1-der`

## Usage

```javascript
import { Universal } from '@complycloud/asn1';
import { DERSerializer } from '@complycloud/asn1-der';
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
DEBUG=complycloud:asn1:der:* <your-exec-here>
```

[@complycloud/asn1]: https://github.com/complycloud/asn1
[@complyify/debug]: https://github.com/complyify/debug
