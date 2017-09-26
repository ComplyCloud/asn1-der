import {
  Constructed,
  Serializer,
  Universal,
} from '@complycloud/asn1';
import Debug from '@complyify/debug';

import {
  IllegalContentError,
  UnsupportedTypeError,
} from '.';

import {
  FLAG_LONG,
  MASK_LENGTH,
} from './constants';

const debug = {
  serialize: new Debug('complycloud:asn1:der:serialize'),
};

// TODO revisit this function, hard to follow, from node-forge
function encodeOID(oidStr) {
  const bytes = [];
  const nodes = oidStr.split('.');
  // first byte is 40 * value1 + value2
  bytes.push((40 * parseInt(nodes[0], 10)) + parseInt(nodes[1], 10)); // first byte = first 2 OID node bullshit
  // other bytes are each value in base 128 with 8th bit set except for the last byte for each value
  for (let i = 2; i < nodes.length; ++i) { // eslint-disable-line no-plusplus
    // produce value bytes in reverse because we don't know how many bytes it will take to store the value
    let last = true;
    const valueBytes = [];
    let value = parseInt(nodes[i], 10);
    do {
      let b = value & MASK_LENGTH;
      value >>>= 7;
      if (!last) { // if value is not last, then turn on 8th bit
        b |= FLAG_LONG;
      }
      valueBytes.push(b);
      last = false;
    } while (value > 0);
    // add value bytes in reverse (needs to be in big endian)
    for (let n = valueBytes.length - 1; n >= 0; --n) { // eslint-disable-line no-plusplus
      bytes.push(valueBytes[n]);
    }
  }
  return bytes;
}

function encodeBigInteger(bigInt) {
  const contentBuffer = bigInt.toBuffer();
  const contentByteArray = Array.prototype.slice.call(contentBuffer, 0);
  return contentByteArray;
}

function bytesToEncodeInt(int) {
  let bytes = 1; // default to at least 1 byte to encode 0 value integer
  if (int > 0) { // because log2(n) / 8 + 1 is going to occassionally have rounding errors thx to float log2 oper
    bytes = 0;
    let num = int;
    while (num > 0) {
      num >>= 8;
      bytes += 1;
    }
  }
  return bytes;
}

function encodeShortInteger(int) {
  const bytes = bytesToEncodeInt(int);
  const buffer = Buffer.alloc(bytes);
  buffer.writeUIntBE(int, 0, bytes);
  const contentByteArray = Array.prototype.slice.call(buffer, 0);
  return contentByteArray;
}

function encodeInteger(int) {
  if (int == null) throw new IllegalContentError('integer content must not be null');
  const intType = typeof int;
  if (intType === 'number') return encodeShortInteger(int);
  if (intType === 'object' && int.constructor.name === 'BigInteger') return encodeBigInteger(int);
  throw new IllegalContentError(`cannot encode integer from ${intType}`);
}

function encodeString(content) {
  const contentType = typeof content;
  if (contentType === 'string') return Array.prototype.slice.call(Buffer.from(content), 0);
  throw new IllegalContentError(`cannot encode ASCII string from ${contentType}`);
}

function derEncodeUniversal(aom) {
  const { content, type } = aom;
  debug.serialize('encoding universal content %s: %s', type, content);
  switch (type) {
    case 'oid':
    case 'roid':
      return encodeOID(content);
    case 'integer':
      return encodeInteger(content);
    case 'numericString':
    case 'printableString':
    case 'ia5String':
    case 'utf8String':
      return encodeString(content);
    case 'bitString':
      return content;
    default:
      throw new UnsupportedTypeError(`DER encoding of universal type "${type}" is not supported`);
  }
}

function derEncodeGeneral(aom) {
  const { content } = aom;
  if (content == null) return null;

  const contentType = typeof content;
  switch (contentType) {
    case 'string': return encodeString(content);
    case 'number': return encodeInteger(content);
    default: throw new UnsupportedTypeError(`DER encoding of "${contentType}" is not supported`);
  }
}

function derEncodeContent(aom) {
  const { content, tagClass } = aom;
  if (content == null) return null;
  if (Buffer.isBuffer(content)) return content;
  switch (tagClass.type) {
    case Universal.type: return derEncodeUniversal(aom);
    default: return derEncodeGeneral(aom);
  }
}

// TODO revisit this function, hard to follow, from node-forge
function encodeLength(contentLength) {
  if (contentLength < 128) return [contentLength];
  const result = [];
  let bytes = '';
  let len = contentLength;
  do {
    bytes += String.fromCharCode(len & 0xFF);
    len >>>= 8;
  } while (len > 0);
  // set first byte to # bytes used to store the length and turn on bit 8 to indicate long-form length is used
  result.push(bytes.length | FLAG_LONG);
  // concatenate length bytes in reverse since they were generated little endian and we need big endian
  for (let i = bytes.length - 1; i >= 0; --i) { // eslint-disable-line no-plusplus
    result.push(bytes.charCodeAt(i));
  }
  return result;
}

function derSerialize(aom) {
  if (aom == null) return null;

  if (Array.isArray(aom)) {
    const values = [];
    aom.forEach((item) => {
      const buffer = derSerialize.call(this, item);
      values.push(...Array.prototype.slice.call(buffer));
    });
    return Buffer.from(values);
  }
  const {
    type: typeName,
    tagClass,
    encoding,
    content,
    value: typeValue,
  } = aom;
  const { type: tagClassName, value: tagClassValue } = tagClass;
  const { type: encodingName, value: encodingValue } = encoding;

  debug.serialize(
    'encoding tag as %s:%s:%s (%h:%h:%h)',
    tagClassName, typeName, encodingName, tagClassValue, typeValue, encodingValue,
  );

  const t = tagClassValue | encodingValue | typeValue;
  const v = encodingName === Constructed.type ? derSerialize.call(this, content) : derEncodeContent(aom);
  const l = v == null ? [0] : encodeLength(v.length);

  const triplet = [t, ...l];
  if (v != null) triplet.push(...Array.prototype.slice.call(v));

  const serialized = Buffer.from(triplet);

  debug.serialize('encoded TLV %h', serialized);

  return serialized;
}

function pemSerialize(der, schema) {
  const pemDer = der.toString('base64').replace(/(.{64})/g, '$1\n');
  return `-----BEGIN ${schema}-----\n${pemDer}\n-----END ${schema}-----\n`;
}

export class DERSerializer extends Serializer {
  serializationImpl(aom) {
    return derSerialize.call(this, aom);
  }
}

export class PEMSerializer extends DERSerializer {
  serializationImpl(aom, { schema } = {}) {
    const der = derSerialize.call(this, aom);
    const pem = pemSerialize.call(this, der, schema);
    return pem;
  }
}
