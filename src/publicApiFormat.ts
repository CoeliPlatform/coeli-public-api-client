import { AcceptedLanguage } from './coeliApi';
import { Entity, formatDatingValue, formatIsoDateText } from './formatUtils';
import {
  ControlledSearchResponse,
  Facet,
  Facets,
  GetSearchResponse,
  SortConditions,
} from './model';

/*
api.coeli.cat returns plain values (strings, numbers, references as
{ href, label }...), while app.coeli.cat returned typed values that this
library formatted with formattedEntity. The functions below convert
api.coeli.cat responses to the same output the library produced with
app.coeli.cat, so clients keep receiving the same data.
*/

// '/coeli/MHC/Classification/General' -> 'Classification'
function referencedType(href: string): string {
  return href.split('/')[3];
}

function isMedia(v: any): boolean {
  return (
    typeof v.mimeType === 'string' &&
    ['original', 'large', 'medium', 'small'].some(
      (size) => typeof v[size] === 'string'
    )
  );
}

// A single dating: { label, year, month?, day?, bc, indexSince, indexUntil }
function isDating(v: any): boolean {
  return typeof v.year === 'number' && 'bc' in v && !v.since && !v.until;
}

// A dating interval: { label, since, until, indexSince, indexUntil }
function isDatingInterval(v: any): boolean {
  return (
    typeof v.label === 'string' &&
    ('since' in v || 'until' in v || 'indexSince' in v || 'indexUntil' in v)
  );
}

function isPeriodInterval(v: any): boolean {
  return (
    !!v.since &&
    !!v.until &&
    typeof v.since.href === 'string' &&
    typeof v.until.href === 'string' &&
    typeof v.label !== 'string'
  );
}

function isChronologicalPeriod(v: any): boolean {
  return (
    typeof v.href === 'string' &&
    referencedType(v.href) === 'ChronologicalPeriod'
  );
}

// Keys formattedEntity kept: no metadata ($...) and no href
function properties(v: any): string[] {
  return Object.keys(v).filter((key) => !key.startsWith('$') && key !== 'href');
}

function formatValue(locale: AcceptedLanguage, v: any): any {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') {
    const date = formatIsoDateText(v, locale);
    return date === undefined ? v : date;
  }
  if (typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((item) => formatValue(locale, item));
  if (isMedia(v)) {
    if (v.mimeType.startsWith('image/')) {
      return {
        original: v.original,
        large: v.large,
        medium: v.medium,
        small: v.small,
        // api.coeli.cat only returns public media
        public: true,
        fileName: v.fileName,
      };
    }
    const media = formatObject(locale, v);
    return { ...media, public: true };
  }
  if (isPeriodInterval(v)) return `${v.since.label} - ${v.until.label}`;
  // app.coeli.cat datings had no display label, formattedEntity built it from
  // year/month/day (e.g. "01/01/1990"); intervals used their label
  if (isDating(v)) return formatDatingValue(v, locale);
  if (isDatingInterval(v) || isChronologicalPeriod(v)) return v.label;
  return formatObject(locale, v);
}

function formatObject(locale: AcceptedLanguage, v: any): any {
  return properties(v).reduce((result: any, key) => {
    result[key] = formatValue(locale, v[key]);
    return result;
  }, {});
}

function formatMetadata(m: any): any {
  if (!m) return m;
  return {
    type: m.type,
    $type: { $type: 'EntityType', name: m.type },
    idInSource: m.idInSource,
    self: {
      href: m.self && m.self.href,
      $metadata: { $type: { $type: 'ReferenceType', references: m.type } },
    },
    updatedAt: m.updatedAt,
    publishedAt: m.publishedAt,
    reverseReferences: [],
    slug: m.slug,
  };
}

export function formattedPublicApiEntity(
  locale: AcceptedLanguage,
  e: any
): Entity {
  return { $metadata: formatMetadata(e.$metadata), ...formatObject(locale, e) };
}

function valueTypeName(value: any): string {
  if (typeof value === 'boolean') return 'Bool';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Integral' : 'Decimal';
  }
  return 'Token';
}

function formatFacet(facet: any): Facet {
  const v = facet.value || {};
  if (typeof v.href === 'string') {
    return {
      value: {
        href: v.href,
        $metadata: {
          $type: { $type: 'ReferenceType', references: referencedType(v.href) },
        },
        label: {
          value: v.label,
          $metadata: { $type: { $type: 'ValueType', name: 'Token' } },
        },
      },
      count: facet.count,
    } as any;
  }
  return {
    value: {
      value: v.value,
      $metadata: {
        $type: { $type: 'ValueType', name: valueTypeName(v.value) },
      },
    },
    count: facet.count,
  } as any;
}

export function formattedPublicApiFacets(facets: any): Facets {
  if (!facets) return facets;
  return Object.keys(facets).reduce((result: any, key) => {
    result[key] = facets[key].map(formatFacet);
    return result;
  }, {});
}

function formatSortConditions(s: any): SortConditions {
  if (!s) return s;
  return {
    sort: (s.sort || []).map((sort: any) => ({
      name: sort.name,
      order:
        typeof sort.order === 'string' ? sort.order.toUpperCase() : sort.order,
    })),
    group: s.group || [],
  };
}

// app.coeli.cat echoed the $type of every search condition
function formatCondition(c: any): any {
  if (!c || typeof c !== 'object') return c;
  if (Array.isArray(c.conditions)) {
    return {
      ...c,
      conditions: c.conditions.map(formatCondition),
      $type: c.$type || 'OrEntitySearchCondition',
    };
  }
  return { ...c, $type: c.$type || 'SimpleEntitySearchCondition' };
}

function formatOriginalSearch(s: any): any {
  if (!s || !Array.isArray(s.conditions)) return s;
  return { ...s, conditions: s.conditions.map(formatCondition) };
}

// Same keys, in the same order, app.coeli.cat returned for a controlled search page
export function formattedPublicApiSearch(
  locale: AcceptedLanguage,
  r: any
): GetSearchResponse<Entity> {
  return {
    originalSearch: formatOriginalSearch(r.originalSearch),
    entities: r.entities.map((e: any) => formattedPublicApiEntity(locale, e)),
    page: r.page,
    facets: formattedPublicApiFacets(r.facets),
    sortConditions: formatSortConditions(r.sortConditions),
    textForImage: null,
    similarImage: null,
  } as any;
}

export function formattedPublicApiControlledSearch(
  r: any
): ControlledSearchResponse {
  if (!r) return r;
  return {
    self: r.self,
    id: r.id,
    tenant: r.tenant,
    entityTypeName: r.entityTypeName,
  };
}
