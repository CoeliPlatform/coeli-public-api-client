import { CoeliEntity, ControlledSearch, ControlledSearchResponse, GetResponse, GetSearchResponse, Page, FacetMode } from './model';
export declare type AcceptedLanguage = 'es' | 'ca' | 'en' | 'fr';
export declare class CoeliApi {
    constructor(tenant: string, token: string);
    private tenant;
    private token;
    private coeliFetch;
    createControlledSearch: (language: AcceptedLanguage, entity: string, search: ControlledSearch) => Promise<ControlledSearchResponse>;
    getControlledSearch: <T>(language: AcceptedLanguage, controlledSearchResponse: ControlledSearchResponse, mapFunction: (gsr: GetSearchResponse<CoeliEntity>) => GetSearchResponse<T>, facets?: string[], page?: Page, facetModes?: FacetMode[]) => Promise<GetSearchResponse<T>>;
    createAndGetControlledSearch: <T>(language: AcceptedLanguage, entity: string, search: ControlledSearch, mapFunction: (gsr: GetSearchResponse<CoeliEntity>) => GetSearchResponse<T>, facets?: string[], page?: Page, facetModes?: FacetMode[]) => Promise<GetSearchResponse<T>>;
    createControlledSearchAndGetAllItems: <T>(language: AcceptedLanguage, entity: string, search: ControlledSearch, mapFunction: (gsr: GetSearchResponse<CoeliEntity>) => GetSearchResponse<T>, facets?: string[], page?: Page) => Promise<GetSearchResponse<T>>;
    getEntityBySlug: <T>(language: AcceptedLanguage, entity: string, slug: string, mapFunction: (ce: CoeliEntity) => T) => Promise<CoeliEntity>;
    getEntityById: <T>(language: AcceptedLanguage, entity: string, id: string, mapFunction: (ce: CoeliEntity) => T) => Promise<CoeliEntity>;
    getEntities: <T>(language: AcceptedLanguage, entity: string, mapFunction: (ce: CoeliEntity) => T) => Promise<GetResponse<T>>;
}
