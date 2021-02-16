import { ControlledSearch, ControlledSearchResponse, GetResponse, GetSearchResponse, Page, FacetMode } from './model';
import { Entity } from './formatUtils';
export declare type AcceptedLanguage = 'es' | 'ca' | 'en' | 'fr';
export declare class CoeliApi {
    constructor(tenant: string, token: string);
    private readonly tenant;
    private readonly token;
    private coeliFetch;
    createControlledSearch: (language: AcceptedLanguage, entity: string, search: ControlledSearch) => Promise<ControlledSearchResponse>;
    getControlledSearch: <T>(language: AcceptedLanguage, controlledSearchResponse: ControlledSearchResponse, mapFunction: (gsr: GetSearchResponse<Entity>) => GetSearchResponse<T>, facets?: string[], page?: Page, facetModes?: FacetMode[]) => Promise<GetSearchResponse<T>>;
    createAndGetControlledSearch: <T>(language: AcceptedLanguage, entity: string, search: ControlledSearch, mapFunction: (gsr: GetSearchResponse<Entity>) => GetSearchResponse<T>, facets?: string[], page?: Page, facetModes?: FacetMode[]) => Promise<GetSearchResponse<T>>;
    createControlledSearchAndGetAllItems: <T>(language: AcceptedLanguage, entity: string, search: ControlledSearch, mapFunction: (gsr: GetSearchResponse<Entity>) => GetSearchResponse<T>, facets?: string[], page?: Page) => Promise<GetSearchResponse<T>>;
    getEntityBySlug: <T>(language: AcceptedLanguage, entity: string, slug: string, mapFunction: (ce: Entity) => T) => Promise<T>;
    getEntityById: <T>(language: AcceptedLanguage, entity: string, id: string, mapFunction: (ce: Entity) => T) => Promise<T>;
    getEntities: <T>(language: AcceptedLanguage, entity: string, mapFunction: (ce: Entity) => T) => Promise<GetResponse<T>>;
}
