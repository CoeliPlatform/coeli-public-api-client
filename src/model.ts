export interface WithValue<T> {
  value: T;
}

export interface Reference {
  href: string;
  label?: WithValue<string>;
}
export interface TimeSpan {
  value?: string;
  $type?: string;
}

export interface TimeSpanInterval {
  $type?: string;
  since: TimeSpan | Reference;
  until: TimeSpan | Reference;
  description?: WithValue<string>;
  label?: WithValue<string>;
}

export type TimeSpanValue = Reference | TimeSpan | TimeSpanInterval;

export type ChronoUnit =
  | 'Days'
  | 'Weeks'
  | 'Months'
  | 'Years'
  | 'Decades'
  | 'Centuries'
  | 'Millennia';

export interface TimeSearchValue {
  value: number;
  unit: ChronoUnit;
}

export type SingleConditionValue =
  | boolean
  | string
  | Reference
  | TimeSpanValue
  | TimeSearchValue;

export type ConditionValue = SingleConditionValue | SingleConditionValue[];

export type Operator =
  | '='
  | 'belongs_to'
  | 'contains'
  | 'exactly_contains'
  | '>'
  | '<'
  | 'between_dates'
  | 'in_date'
  | 'between_periods'
  | 'in_period'
  | 'before_date'
  | 'before_n_date'
  | 'after_date'
  | 'after_n_date'
  | 'exactly_in_period'
  | 'is_defined';

export type FacetMode = 'Equals' | 'BelongsTo';

export type ControlledSearchConditionType =
  | 'SimpleEntitySearchCondition'
  | 'OrEntitySearchCondition';

export type ControlledSearchCondition =
  | OrControlledSearchCondition
  | SimpleControlledSearchCondition;

export interface OrControlledSearchCondition {
  $type: ControlledSearchConditionType;
  conditions: ControlledSearchCondition[];
}

export interface SimpleControlledSearchCondition {
  $type: ControlledSearchConditionType;
  property: string;
  operator: Operator;
  value: ConditionValue;
  default?: boolean;
}

export type Order = 'ASC' | 'DESC';

export interface SortConditions {
  sort: Array<{ name: string; order: Order }>;
  group: Array<{ name: string; order: Order }>;
}

export interface ControlledSearch {
  conditions: ControlledSearchCondition[];
  sortCondition?: SortConditions;
  name?: string;
}

export interface ControlledSearchResponse {
  self: Reference;
  id: string;
  tenant: string;
  entityTypeName: string;
}

export interface Facet {
  value: Reference | WithValue<number | string | boolean>;
  count: number;
}

export interface Facets {
  [index: string]: Facet[];
}

export interface Page {
  limit: number;
  maxOffset: number;
  offset: number;
  total: number;
}

// export interface CoeliEntity {
//   [prop: string]: any;
// }

export interface GetResponse<T> {
  entities: T[];
  page: Page;
}

export interface GetSearchResponse<T> extends GetResponse<T> {
  facets: Facets;
  originalSearch: ControlledSearch;
  sortConditions: SortConditions;
  url: string;
}
