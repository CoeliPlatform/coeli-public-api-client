import { AcceptedLanguage } from './coeliApi';
type PrimitiveValueMetadata = {
  $type: {
    $type: PrimitiveValueType;
    name: string;
  };
};
interface WithValue<V> {
  value: V;
  $metadata: PrimitiveValueMetadata;
}
interface HasProperties {
  [name: string]: any;
}
type PrimitiveValueType = 'ValueType';
type NumericValueMetadata = {
  $type: {
    $type: PrimitiveValueType;
    name: string;
    unit?: string;
  };
};
interface ReferenceMetadata {
  $type: {
    $type: string;
    references: string;
  };
}
interface WithValues<V> {
  values: V[];
}
interface WithNumericValue extends WithValue<number> {
  $metadata: NumericValueMetadata;
}
type URL = WithValue<string>;
type Token = WithValue<string>;
type TokenNl = WithValue<string>;
type LongString = WithValue<string>;
type Bool = WithValue<boolean>;
type Integral = WithNumericValue;
type Decimal = WithNumericValue & { numDecimals: number };
type AutoNumeric = WithNumericValue;
type Dating = WithValue<string> & {
  year: number;
  month?: number;
  day?: number;
  bc: boolean;
  indexSince?: { value: string };
  indexUntil?: { value: string };
  uncertaintyBefore?: string;
  uncertaintyAfter?: string;
  display?: string;
};
interface IllegalCycleReference {
  references: Reference[];
}

type IllegalCause = IllegalCycleReference;
interface IllegalValue {
  value: string;
  rang: string;
  cause: IllegalCause;
}
type Date = WithValue<string>;
type SingleValue = PrimitiveValue | IllegalValue | Embedded | Reference;
type NullValue = null;
type Value =
  | ((SingleValue | RepeatedValue<SingleValue>) & { isCalculated?: boolean })
  | NullValue;
type Binary = URL;
type PrimitiveValue =
  | URL
  | Token
  | TokenNl
  | LongString
  | Bool
  | Integral
  | Decimal
  | AutoNumeric
  | Dating
  | Date
  | Binary
  | Image;
type RepeatedValue<T extends SingleValue> = WithValues<T>;
interface PartialReference {
  href: string;
  label?: Token;
  $metadata: ReferenceMetadata;
}

type Reference = HasProperties & PartialReference;
interface EmbeddedMetadata {
  $type: {
    $type: 'EmbeddedType';
    name: string;
  };
  id: string;
}
interface ReverseReference {
  entityName: string;
  propertyName: string;
  count: number;
}
interface EntityMetadata {
  self: Reference;
  type?: string;
  $type: {
    $type: string;
    name: string;
  };
  createdBy?: Reference;
  createdAt?: string;
  updatedBy?: Reference;
  updatedAt?: string;
  published: boolean;
  publishedBy?: Reference;
  publishedAt?: string;
  reverseReferences: ReverseReference[];
  pendingToValidate: boolean;
  idInSource: string;
  version: number;
  slug: string;
  recordLists: any[];
}
type PartialEntity = { $metadata: EntityMetadata };

export type Entity = PartialEntity & HasProperties;
interface KeyValue {
  key: string;
  value: Value;
}

type PartialEmbedded = { $metadata: EmbeddedMetadata };
type Embedded = PartialEmbedded & HasProperties;
function getProperties(
  hasProperties: Embedded | Reference | Entity
): KeyValue[] {
  const keysWithoutMetadata = hasProperties
    ? Object.keys(hasProperties).filter((p) => !p.startsWith('$'))
    : [];
  return keysWithoutMetadata
    .filter((p) => p != 'href')
    .map((x) => {
      return { key: x, value: (hasProperties as any)[x] };
    });
}
function isPrimitiveValue(x: Value): x is PrimitiveValue {
  return (
    !!x &&
    (isImage(x) ||
      (!!x &&
        (x as any).$metadata &&
        (x as any).$metadata.$type &&
        (x as any).$metadata.$type.$type == 'ValueType'))
  );
}

function isBoolean(x: Value): x is Bool {
  return (
    !!x &&
    (x as any).$metadata &&
    (x as any).$metadata.$type &&
    (x as any).$metadata.$type.name == 'Bool'
  );
}
interface Media {
  original: URL;
  public: Bool;
  fileName?: TokenNl;
  mimeType: TokenNl;
}

interface Image extends Media {
  large?: URL;
  medium?: URL;
  small?: URL;
}

interface Video extends Media {
  thumbnail?: URL;
  small?: URL;
  medium?: URL;
  stream?: URL;
}

interface Pdf extends Media {
  small?: URL;
}

interface Audio extends Media {}
function isDecimal(value: PrimitiveValue): value is Decimal {
  return value && !isImage(value) && value.$metadata.$type.name == 'Decimal';
}

function isIntegral(value: PrimitiveValue): value is Integral {
  return value && !isImage(value) && value.$metadata.$type.name == 'Integral';
}
function isAutoNumeric(value: PrimitiveValue): value is AutoNumeric {
  return (
    value && !isImage(value) && value.$metadata.$type.name == 'AutoNumeric'
  );
}

function isEmbedded(x: Value): x is Embedded {
  return (
    !isImage(x) &&
    (x as Embedded).$metadata &&
    (x as Embedded).$metadata.$type &&
    (x as Embedded).$metadata.$type.$type == 'EmbeddedType'
  );
}

function isMedia(x: Value): x is Media {
  return (
    !!x &&
    !!(x as Media).original &&
    !!(x as Media).public &&
    !!(x as Media).mimeType
  );
}

function isImage(x: Value): x is Image {
  return isMedia(x) && x.mimeType.value.startsWith('image/');
}

function isVideo(x: Value): x is Video {
  const mimeType: string =
    (isMedia(x) && !!(x as Video).mimeType && (x as Video).mimeType.value) ||
    '';
  return mimeType.startsWith('video/') && !isPublicVideoStream(x);
}

function isPublicVideoStream(x: Value): x is Video {
  const mimeType: string =
    (isMedia(x) && !!(x as Video).mimeType && (x as Video).mimeType.value) ||
    '';
  const stream =
    !!(isMedia(x) && !!(x as Video).stream && (x as Video).stream!.value) &&
    (x as Video).stream!.value.includes('public');
  return mimeType.startsWith('video/') && stream;
}

function isPdf(x: Value): x is Pdf {
  const mimeType: string =
    (isMedia(x) && !!(x as Pdf).mimeType && (x as Pdf).mimeType.value) || '';
  return mimeType == 'application/pdf';
}

function isAudio(x: Value): x is Audio {
  const mimeType: string =
    (isMedia(x) && !!(x as Audio).mimeType && (x as Audio).mimeType.value) ||
    '';
  return mimeType.startsWith('audio/');
}

function isReference(x: Value): x is Reference {
  return !!(x as Reference).href;
}

function isIllegalValue(x: Value): x is IllegalValue {
  return !!(x as IllegalValue).cause;
}

function isCycleReference(x: IllegalCause): x is IllegalCycleReference {
  return !!(x as IllegalCycleReference).references;
}

function isRepeatedValue<T>(
  t: T | RepeatedValue<SingleValue>
): t is RepeatedValue<SingleValue> {
  return !!(
    (t as RepeatedValue<SingleValue>) &&
    (t as RepeatedValue<SingleValue>).values
  );
}

function isCalculatedValue(v: Value): boolean {
  return !!(v && v.isCalculated);
}

function isSingleValue(x: Value): x is SingleValue {
  return (
    !!x &&
    (isPrimitiveValue(x) ||
      isIllegalValue(x) ||
      isReference(x) ||
      isEmbedded(x))
  );
}

function isValue(x: any): x is Value {
  return (
    !x || // NullValue
    isRepeatedValue(x) ||
    isSingleValue(x)
  );
}

function isDating(value: any): value is Dating {
  return value && value.year && typeof value.bc !== 'undefined';
}

interface CoeliDate extends Dating {
  year: number;
  month: number;
  day: number;
  bc: boolean;
}

function isCoeliDate(value: any): value is CoeliDate {
  return !!(
    value &&
    value.year &&
    value.month &&
    value.day &&
    typeof value.bc !== 'undefined'
  );
}

function formatNumber(
  n: number,
  locale: AcceptedLanguage,
  maxDecimals: number,
  minDecimals = maxDecimals
): string {
  return n.toLocaleString(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}
function myPadStart(num: number, length: number, char: string) {
  let text = num.toString();
  return text.length >= length
    ? text
    : char.repeat(length - text.length) + text;
}
function orEmpty(x?: string): string {
  return x ? x : '';
}
function dateTemplate(locale: AcceptedLanguage): string {
  const d = new Date(2000, 5, 13);
  const str = d.toLocaleDateString(locale);
  // Javascript Date's month starts from zero.
  return str.replace('2000', 'year').replace('6', 'month').replace('13', 'day');
}
function formatDate(d: CoeliDate, locale: AcceptedLanguage | 'iso'): string {
  const year = (d.bc ? '-' : '') + myPadStart(d.year, 4, '0');
  const month = myPadStart(d.month, 2, '0');
  const day = myPadStart(d.day, 2, '0');
  if (locale == 'iso') {
    return `${year}-${month}-${day}`;
  } else {
    const template = dateTemplate(locale);
    return template
      .replace('year', year)
      .replace('month', month)
      .replace('day', day);
  }
}
function formatDating(d: Dating, locale: AcceptedLanguage): string {
  if (d.display) return d.display;
  const year = (d.bc ? '-' : '') + myPadStart(d.year, 4, '0');
  const mid = isCoeliDate(d)
    ? formatDate(d, locale)
    : d.month
    ? `${myPadStart(d.month, 2, '0')}/${year}`
    : year;
  return orEmpty(d.uncertaintyBefore) + mid + orEmpty(d.uncertaintyAfter);
}
const isoDateRegex: RegExp = /^(-?\d{4})-(\d{2})-(\d{2})$/;

function isIsoDate(text: string): boolean {
  return isoDateRegex.test(text);
}
function createDating(
  value: string,
  year: number,
  month?: number,
  day?: number,
  bc: boolean = false
): Dating {
  return {
    value: value,
    year: year,
    month: month,
    day: day,
    bc: bc,
    $metadata: {
      $type: {
        $type: 'ValueType' as PrimitiveValueType,
        name: 'Dating',
      },
    },
  };
}
function createTokenNl(token: string): TokenNl {
  return {
    value: token,
    $metadata: {
      $type: {
        $type: 'ValueType' as PrimitiveValueType,
        name: 'TokenNl',
      },
    },
  };
}
function fromIsoDate(text: string): CoeliDate | TokenNl {
  const res = isoDateRegex.exec(text);
  if (res && res.length == 4) {
    const year = parseInt(res[1]);
    return createDating(
      text,
      Math.abs(year),
      parseInt(res[2]),
      parseInt(res[3]),
      year < 0
    );
  } else {
    console.error('Date not in ISO format: ', text);
    return createTokenNl(text);
  }
}
interface TimeSpan {
  value?: string;
  $type?: string;
}
interface TimeSpanInterval {
  $type?: string;
  since: TimeSpan | Reference;
  until: TimeSpan | Reference;
  description?: WithValue<string>;
  label?: WithValue<string>;
}

interface PeriodInterval {
  $metadata: EmbeddedMetadata;
  since: Reference;
  until: Reference;
}

function isPeriodInterval(value: any): value is PeriodInterval {
  return value.$metadata.$type.name === 'PeriodInterval';
}
function isDatingInterval(value: any): value is TimeSpanInterval {
  return value.$metadata.$type.name === 'DatingInterval';
}
function isChronologicalPeriod(value: any): value is Reference {
  return value.$metadata.$type.references === 'ChronologicalPeriod';
}

export function formattedEntity(locale: AcceptedLanguage, e: Entity): Entity {
  const props = getProperties(e);

  function loop(value: Value): any {
    if (isSingleValue(value)) {
      if (isPrimitiveValue(value)) {
        if (isDecimal(value))
          return (
            formatNumber(value.value, locale, 2) + value.$metadata.$type.unit ||
            ''
          );
        else if (isIntegral(value))
          return (
            formatNumber(value.value, locale, 0) + value.$metadata.$type.unit ||
            ''
          );
        else if (isAutoNumeric(value))
          return (
            formatNumber(value.value, locale, 0) + value.$metadata.$type.unit ||
            ''
          );
        else if (isImage(value)) {
          return {
            original: value.original.value,
            large: value.large && value.large.value,
            medium: value.medium && value.medium.value,
            small: value.small && value.small.value,
            public: value.public.value,
            fileName: value.fileName && value.fileName.value,
          };
        } else if (isDating(value)) return formatDating(value, locale);
        else if (isCoeliDate(value)) return formatDate(value, locale);
        else if (isIsoDate(String(value.value)))
          return formatDate(
            fromIsoDate(String(value.value)) as CoeliDate,
            locale
          );
        else if (value.value === null) return '';
        else return value.value;
      } else if (isIllegalValue(value))
        return value.value + ' -> ' + value.cause;
      else {
        //isEmbedded or Reference
        if (isPeriodInterval(value)) {
          return value.since.label!.value + ' - ' + value.until.label!.value;
        } else if (isDatingInterval(value)) {
          return value.label!.value;
        } else if (isChronologicalPeriod(value)) {
          return value.label!.value;
        }
        const embOrRefProps = getProperties(value);
        const res: any = {};
        return embOrRefProps.reduce<HasProperties>(
          (prev: HasProperties, curr: KeyValue) => {
            prev[curr.key] = loop(curr.value);
            return prev;
          },
          {}
        );
      }
    } else if (isRepeatedValue(value)) {
      return value.values.map((x) => loop(x));
    } else return '';
  }

  const result: any = {};
  props
    .map((x) => [x.key, loop(x.value)])
    .forEach((x) => (result[x[0]] = x[1]));
  return { $metadata: e.$metadata, ...result };
}
