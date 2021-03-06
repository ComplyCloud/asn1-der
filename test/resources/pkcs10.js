import { ContextSpecific, Universal } from '@complycloud/asn1';

const {
  Sequence,
  Integer,
  Set,
  OID,
  PrintableString,
  IA5String,
  Null,
  BitString,
} = Universal;

const countryOID = new OID('2.5.4.6');
const countryName = new PrintableString('US');
const country = new Set([new Sequence([countryOID, countryName])]);

const provinceOID = new OID('2.5.4.8');
const provinceName = new PrintableString('Texas');
const province = new Set([new Sequence([provinceOID, provinceName])]);

const localityOID = new OID('2.5.4.7');
const localityName = new PrintableString('Dallas');
const locality = new Set([new Sequence([localityOID, localityName])]);

const orgOID = new OID('2.5.4.10');
const orgName = new PrintableString('Complyify LLC');
const org = new Set([new Sequence([orgOID, orgName])]);

const ouOID = new OID('2.5.4.11');
const ouName = new PrintableString('Engineering');
const ou = new Set([new Sequence([ouOID, ouName])]);

const cnOID = new OID('2.5.4.3');
const cnName = new PrintableString('Test Cert for Testing Only Plz');
const cn = new Set([new Sequence([cnOID, cnName])]);

const emailOID = new OID('1.2.840.113549.1.9.1');
const emailName = new IA5String('comply@whiterabbit.wtf');
const email = new Set([new Sequence([emailOID, emailName])]);

const version = new Integer(0);
const subject = new Sequence([country, province, locality, org, ou, cn, email]);

const rsaType = new Sequence([new OID('1.2.840.113549.1.1.1'), new Null()]);
const rsaPublicKey = new BitString(Buffer.from([
  0x00, 0x30, 0x81, 0x89, 0x02, 0x81, 0x81, 0x00, 0xc6, 0x39, 0x08, 0xc3, 0xfc, 0x14, 0x1a, 0xe9, 0x9c, 0x85, 0xa7,
  0x48, 0xd5, 0xea, 0x6e, 0x52, 0xf5, 0x43, 0xbc, 0xf1, 0x8c, 0x58, 0x9a, 0x4b, 0x07, 0xa3, 0x9c, 0x81, 0x9a, 0xcb,
  0xa9, 0x3d, 0x89, 0x0a, 0xd4, 0x4b, 0x54, 0xc3, 0xea, 0x95, 0x3c, 0xa0, 0x90, 0x5c, 0x86, 0x53, 0xcc, 0xcc, 0x7f,
  0x2d, 0xae, 0x33, 0xa3, 0xbe, 0x36, 0xf7, 0xe1, 0xda, 0x9a, 0xf4, 0x08, 0x01, 0x37, 0xa0, 0x31, 0x10, 0xf5, 0xe0,
  0x6e, 0xf0, 0x36, 0xa9, 0x2a, 0xc9, 0x96, 0x72, 0x3d, 0xf8, 0x1c, 0x5e, 0x3e, 0x8f, 0xa5, 0x61, 0x99, 0x7c, 0xf2,
  0xcf, 0xc3, 0x6e, 0xf3, 0x65, 0xc6, 0xfa, 0xbb, 0x97, 0xeb, 0x1e, 0xb0, 0x29, 0x42, 0x59, 0x99, 0xf8, 0xf0, 0x31,
  0xb3, 0x21, 0x55, 0x35, 0xc0, 0xfd, 0x5c, 0x63, 0x8e, 0x7f, 0xc3, 0x76, 0xf7, 0x57, 0xba, 0xb5, 0x14, 0xcf, 0x51,
  0xb9, 0x8e, 0xb7, 0x02, 0x03, 0x01, 0x00, 0x01,
]));
const publicKey = new Sequence([rsaType, rsaPublicKey]);

const wtf = new ContextSpecific(0);
const sha1RsaOID = new OID('1.2.840.113549.1.1.5');
const n = new Null();

const csrSequence = new Sequence([version, subject, publicKey, wtf]);
const algoSequence = new Sequence([sha1RsaOID, n]);
const signature = new BitString(Buffer.from([
  0x00, 0xbb, 0x12, 0x74, 0x8b, 0x19, 0xce, 0x6a, 0x74, 0xbd, 0xe7, 0x76, 0x2f, 0x62, 0x93, 0x94, 0xce, 0xb5, 0x81,
  0x90, 0x44, 0x66, 0x1c, 0x05, 0xe1, 0x7b, 0xc7, 0xe3, 0xf5, 0x7e, 0x80, 0x59, 0xb3, 0x94, 0x3a, 0x68, 0xa0, 0x4a,
  0x43, 0x66, 0x5e, 0x34, 0xbd, 0x2b, 0x33, 0x0c, 0x8d, 0x52, 0x51, 0x3e, 0x0c, 0x36, 0xb1, 0x5f, 0x65, 0x8c, 0xdd,
  0xca, 0x45, 0x67, 0xd9, 0x09, 0xfe, 0x38, 0xf6, 0x44, 0x44, 0xb3, 0x5f, 0xaf, 0xfa, 0xa4, 0x48, 0xd6, 0x33, 0x18,
  0xc8, 0x65, 0x57, 0x6a, 0xd0, 0x61, 0xdf, 0x17, 0x64, 0xa4, 0xb6, 0x08, 0x72, 0xbb, 0x9f, 0x72, 0x4e, 0xb8, 0x9b,
  0x1b, 0x44, 0x69, 0x4e, 0xcd, 0x13, 0x36, 0xa7, 0x69, 0x1d, 0xde, 0x51, 0xd2, 0x45, 0xc5, 0x5b, 0x68, 0x22, 0x4b,
  0x7e, 0x2d, 0x92, 0xe0, 0x01, 0x6d, 0xad, 0x45, 0x49, 0x81, 0x43, 0xa2, 0x03, 0xd2, 0x91,
]));

const pkcs10 = new Sequence([csrSequence, algoSequence, signature]);

export default pkcs10;
