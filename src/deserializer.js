import {
  findEncoding, findTagClass, findType,
  Constructed,
  Deserializer,
  Universal,
} from '@complycloud/asn1';
import Debug from '@complyify/debug';
import BigInteger from 'node-biginteger';

import { IllegalContentError } from '.';
import {
  FLAG_CONSTRUCTED,
  FLAG_LONG,
  MASK_LENGTH,
  MASK_TAG_CLASS,
  MASK_TAG_ENCODING,
  MASK_TAG_TYPE,
  PATTERN_PEM,
} from './constants';

const debug = {
  decode: new Debug('complycloud:asn1:der:deserialize:decode'),
  deserialize: new Debug('complycloud:asn1:der:deserialize'),
  deserializeBinary: new Debug('complycloud:asn1:der:deserialize:binary'),
};

function validateDER(der) {
  if (der === null) throw new IllegalContentError('DER must not be null');
  if (der === undefined) throw new IllegalContentError('DER must not be undefined');
  if (typeof der !== 'object' || !Buffer.isBuffer(der)) throw new IllegalContentError('DER must be a buffer');
  if (der.length < 1) throw new IllegalContentError('DER buffer is empty');
}

function validatePEM(pem) {
  if (pem === null) throw new IllegalContentError('PEM must not be null');
  if (pem === undefined) throw new IllegalContentError('PEM must not be undefined');
  const pemType = typeof pem;
  if (pemType !== 'string') throw new IllegalContentError(`Cannot deserialize PEM from "${pemType}", must be a string`);
  if (pem.length < 27) throw new IllegalContentError('Improperly formatted PEM content, too short');
  if (!PATTERN_PEM.test(pem)) throw new IllegalContentError('Improperly formatted PEM content');
}

function derFromPEM(pem) {
  const b64String = PATTERN_PEM.exec(pem)[2].replace(/\s+/g, '');
  return Buffer.from(b64String, 'base64');
}

/** Parse TLV triplet for long form content byte boundaries */
function longContentBytes(buffer, tlvFirstByte) {
  const lengthOctetsBytePosition = tlvFirstByte + 1;
  debug.deserializeBinary('deserializing long form content length from byte %d', lengthOctetsBytePosition);
  const lengthOctetsByte = buffer[lengthOctetsBytePosition];
  debug.deserializeBinary('deserializing long form content length octet %b', lengthOctetsByte);
  const lengthOctets = lengthOctetsByte & MASK_LENGTH;
  debug.deserializeBinary('isolated long form content length %b', lengthOctets);
  if (lengthOctets > 6) {
    throw new IllegalContentError('content length exceeds maximum supported of 2^32 bytes');
  }
  const lengthStartByte = lengthOctetsBytePosition + 1;
  const lengthEndByte = lengthStartByte + (lengthOctets - 1);
  debug.deserializeBinary(
    'processing %d bytes (bytes %d thru %d) to identify content length',
    lengthOctets, lengthStartByte, lengthEndByte,
  );
  const length = buffer.readUIntBE(lengthStartByte, lengthOctets);
  debug.deserialize('deserialized content length of %d bytes', length);
  const startByte = lengthEndByte + 1;
  const endByte = startByte + (length - 1);
  return { startByte, endByte };
}

/** Parse TLV triplet for short form content byte boundaries */
function shortContentBytes(buffer, tlvFirstByte) {
  const lengthBytePosition = tlvFirstByte + 1;
  debug.deserializeBinary('deserializing short form content length from byte %d', lengthBytePosition);
  const lengthByte = buffer[lengthBytePosition];
  debug.deserializeBinary('deserializing short form content length octet %b', lengthByte);
  const length = lengthByte & MASK_LENGTH;
  debug.deserializeBinary('isolated short form content length %b', length);
  debug.deserializeBinary('deserialized content length of %d bytes', length);
  let startByte = null;
  let endByte = null;
  if (length !== 0) {
    startByte = lengthBytePosition + 1;
    endByte = startByte + (length - 1);
  }
  return { startByte, endByte };
}

/** Parse TLV triplet for content byte boundaries */
function contentBytes(buffer, tlvFirstByte) {
  const lengthByte = tlvFirstByte + 1;
  const octet = buffer[lengthByte];
  if (octet == null) {
    throw new IllegalContentError(`no length byte at pos ${lengthByte}, only ${buffer.length} bytes avaliable`);
  }
  if (octet & FLAG_LONG) {
    return longContentBytes(buffer, tlvFirstByte);
  }
  return shortContentBytes(buffer, tlvFirstByte);
}

/** Parse TLV triplet for the metadata and content buffer */
function tlv(buffer, firstByte) {
  const byte = firstByte;
  debug.deserializeBinary('deserializing TLV triplet from byte %d', byte);
  const tagOctet = buffer[byte];
  if (!tagOctet) {
    throw new IllegalContentError(`no type byte at pos ${byte}, only ${buffer.length} bytes avaliable`);
  }
  const tagClass = tagOctet & MASK_TAG_CLASS;
  debug.deserialize('deserialized tag class %d', tagClass);
  const encoding = tagOctet & MASK_TAG_ENCODING;
  debug.deserialize('deserialized tag encoding %d', encoding);
  const type = tagOctet & MASK_TAG_TYPE; // TODO: support long form tag types (non-universal)
  debug.deserialize('deserialized tag type %d', type);
  const { startByte: contentStart, endByte: contentEnd } = contentBytes(buffer, byte);
  let content = null;
  let lastByte = byte + 1; // null content type indicator in DER encoding is always 2 bytes (0x05 0x00)
  if (contentStart != null && contentEnd != null) { // if content is not null, change the aforementioned defaults
    debug.deserializeBinary('isolating content from bytes %d through %d', contentStart, contentEnd);
    if (contentEnd > buffer.length) {
      throw new IllegalContentError(`too few bytes to read ${contentEnd - contentStart} bytes of ASN.1 content from ` +
        `byte ${contentStart}, only ${buffer.length} bytes avaliable`);
    }
    content = buffer.slice(contentStart, contentEnd + 1);
    lastByte = contentEnd;
  }
  return {
    tagClass,
    encoding,
    type,
    content,
    lastByte,
  };
}

function decodeOID(buffer) {
  debug.decode('decoding OID from %d bytes', buffer.length);
  let b = buffer[0];
  let oid = `${Math.floor(b / 40)}.${b % 40}`; // stupid first byte = first 2 OID node encoding bullshit
  // other bytes are each value in base 128 with 8th bit set except for the last byte for each value
  let value = 0;
  let i = 1;
  while (i < buffer.length) {
    b = buffer[i];
    value <<= 7;
    if (b & FLAG_LONG) { // not the last byte for the value
      value += b & ~FLAG_LONG;
    } else { // last byte
      oid += `.${value + b}`;
      value = 0;
    }
    i += 1;
  }
  debug.decode('decoded OID %s', oid);
  return oid;
}

function decodeString(buffer) {
  debug.decode('decoding string from %d bytes', buffer.length);
  const str = buffer.toString('utf8');
  debug.decode('decoded string "%s"', str);
  return str;
}

function decodeInteger(buffer) {
  debug.decode('decoding integer from %d bytes', buffer.length);
  const int = buffer.length > 8 ? BigInteger.fromBuffer(1, buffer) : buffer.readUIntBE(0, buffer.length);
  debug.decode('decoded integer %s', int);
  return int;
}


function decode(obj) {
  if (obj == null) {
    debug.decode('skipping decode of null/undefined content');
    return null;
  }
  if (Array.isArray(obj)) {
    debug.decode('decoding collection of %d content items', obj.length);
    return obj.map(item => decode(item));
  }
  const TagClass = findTagClass(obj.tagClass);
  const Encoding = findEncoding(obj.encoding);
  const Type = TagClass.name === Universal.name ? findType(obj.type) : null;
  debug.decode(
    'decoding %s:%s:%s',
    TagClass ? TagClass.name : 'unknown',
    Encoding ? Encoding.name : 'unknown',
    Type ? Type.name : 'unknown',
  );
  let content = Encoding.name === Constructed.name ? decode(obj.children) : obj.content;
  if (Type) {
    switch (Type.name) {
      case 'OID':
      case 'ROID':
        content = decodeOID(content);
        break;
      case 'PrintableString':
      case 'IA5String':
      case 'UTF8String':
        content = decodeString(content);
        break;
      case 'Integer':
        content = decodeInteger(content);
        break;
      default:
        debug.decode('no decoding supported for %s', Type.name);
    }
    return new Type(content, { encoding: Encoding });
  }
  return new TagClass(obj.type, content, Encoding);
}

function derDeserialize(buffer, level = 1) {
  if (buffer == null) return null;
  debug.deserialize('deserializing %d bytes of DER', buffer.length);
  let byte = 0;
  const values = [];
  do {
    const {
      tagClass,
      encoding,
      type,
      content,
      lastByte,
    } = tlv(buffer, byte);
    const value = {
      tagClass,
      encoding,
      type,
      content,
    };
    if (encoding & FLAG_CONSTRUCTED && type !== Universal.EOC.value) {
      delete value.content;
      value.children = derDeserialize(content, level + 1);
    }
    values.push(value);
    byte = lastByte + 1;
  } while (byte < buffer.length);
  debug.deserialize('done deserializing DER, found %d entries', values.length);
  return values.length === 1 && level === 1 ? values[0] : values;
}

export class DERDeserializer extends Deserializer {
  deserializationImpl(der) { // eslint-disable-line class-methods-use-this
    validateDER(der);
    const aom = decode(derDeserialize(der));
    return aom;
  }
}

export class PEMDeserializer extends Deserializer {
  deserializationImpl(pem) { // eslint-disable-line class-methods-use-this
    validatePEM(pem);
    const der = derFromPEM(pem);
    const aom = decode(derDeserialize(der));
    return aom;
  }
}
