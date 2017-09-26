import { ASN1Error } from '@complycloud/asn1';

export class DERError extends ASN1Error { }
export class UnsupportedTypeError extends DERError { }
export class IllegalContentError extends DERError { }
