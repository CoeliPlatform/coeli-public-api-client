import { AcceptedLanguage } from './coeliApi';
import { Entity } from './formatUtils';
import { ControlledSearchResponse, Facets, GetSearchResponse } from './model';
export declare function formattedPublicApiEntity(locale: AcceptedLanguage, e: any): Entity;
export declare function formattedPublicApiFacets(facets: any): Facets;
export declare function formattedPublicApiSearch(locale: AcceptedLanguage, r: any): GetSearchResponse<Entity>;
export declare function formattedPublicApiControlledSearch(r: any): ControlledSearchResponse;
