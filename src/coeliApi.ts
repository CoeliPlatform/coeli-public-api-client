import fetch from 'isomorphic-fetch';
import {
  ControlledSearch,
  ControlledSearchResponse,
  GetResponse,
  GetSearchResponse,
  Page,
  FacetMode,
} from './model';
import { Entity, formattedEntity } from './formatUtils';

export type AcceptedLanguage = 'es' | 'ca' | 'en' | 'fr';

export class CoeliApi {
  constructor(tenant: string, token: string) {
    this.tenant = tenant;
    this.token = token;
  }
  private readonly tenant: string;
  private readonly token: string;

  private coeliFetch = async <R, T>(
    partialUrl: string,
    language: AcceptedLanguage,
    method: string = 'GET',
    mapFunction: (r: R) => T,
    body?: object
  ): Promise<T> => {
    const url = `https://app.coeli.cat/coeli/${this.tenant}${partialUrl}`;

    const headers: HeadersInit = {
      'Accept-Language': language,
      Authorization: `Authorization ${this.token}`,
      'Content-Language': language,
      'Content-Type': 'application/json',
    };
    const requestInit: RequestInit = {
      body: JSON.stringify(body),
      headers,
      method,
    };
    try {
      const response = await fetch(url, requestInit);
      if (response.status >= 400) {
        throw new Error(
          `An error occurred trying to request Coeli api, url:\n ${url}\n with status ${
            response.status
          }, ${response.statusText}: \n${JSON.stringify(requestInit)}`
        );
      }
      const jsonResponse = ((await response.json()) as unknown) as R;
      return mapFunction(jsonResponse);
    } catch (e) {
      console.trace(`Error in GET ${url}`, e);
    }
  };

  createControlledSearch = async (
    language: AcceptedLanguage,
    entity: string,
    search: ControlledSearch
  ): Promise<ControlledSearchResponse> => {
    return await this.coeliFetch<
      ControlledSearchResponse,
      ControlledSearchResponse
    >(
      `/${entity}/search`,
      language,
      'POST',
      (x: ControlledSearchResponse) => x,
      search
    );
  };

  getControlledSearch = async <T>(
    language: AcceptedLanguage,
    controlledSearchResponse: ControlledSearchResponse,
    mapFunction: (gsr: GetSearchResponse<Entity>) => GetSearchResponse<T>,
    facets?: string[],
    page?: Page,
    facetModes?: FacetMode[]
  ): Promise<GetSearchResponse<T>> => {
    const partialUrl = `/${controlledSearchResponse.entityTypeName}/search/${
      controlledSearchResponse.id
    }${
      facets
        ? `/?${
            page
              ? `limit=${page.limit}&offset=${page.offset}`
              : 'limit=25&offset=0'
          }` +
          '&facet=' +
          facets.join(',')
        : `/?${
            page
              ? `limit=${page.limit}&offset=${page.offset}`
              : 'limit=25&offset=0'
          }`
    }${facetModes ? '&facetMode=' + facetModes.join(',') : ''}`;
    const getSearchResponse = await this.coeliFetch<
      GetSearchResponse<Entity>,
      GetSearchResponse<Entity>
    >(partialUrl, language, 'GET', (x) => x);
    return mapFunction({
      ...getSearchResponse,
      ...{
        entities: getSearchResponse.entities.map((e) =>
          formattedEntity(language, e)
        ),
      },
      url:
        '/' + controlledSearchResponse.self.href.split('/').slice(3).join('/'),
    });
  };
  createAndGetControlledSearch = async <T>(
    language: AcceptedLanguage,
    entity: string,
    search: ControlledSearch,
    mapFunction: (gsr: GetSearchResponse<Entity>) => GetSearchResponse<T>,
    facets?: string[],
    page?: Page,
    facetModes?: FacetMode[]
  ): Promise<GetSearchResponse<T>> => {
    const controlledSearchResponse = await this.createControlledSearch(
      language,
      entity,
      search
    );
    return await this.getControlledSearch(
      language,
      controlledSearchResponse,
      mapFunction,
      facets,
      page,
      facetModes
    );
  };
  createControlledSearchAndGetAllItems = async <T>(
    language: AcceptedLanguage,
    entity: string,
    search: ControlledSearch,
    mapFunction: (gsr: GetSearchResponse<Entity>) => GetSearchResponse<T>,
    facets?: string[],
    page?: Page
  ): Promise<GetSearchResponse<T>> => {
    const controlledSearchResponse = await this.createControlledSearch(
      language,
      entity,
      search
    );
    const firstBatch = await this.getControlledSearch(
      language,
      controlledSearchResponse,
      mapFunction,
      facets,
      page || {
        limit: 200,
        maxOffset: 0,
        offset: 0,
        total: 0,
      }
    );

    const loop = async (acc: T[], page: Page): Promise<T[]> => {
      if (page.offset + page.limit > page.maxOffset) {
        return acc;
      } else if (page.offset + page.limit > page.total) {
        return acc;
      } else {
        const arr = await this.getControlledSearch(
          language,
          controlledSearchResponse,
          mapFunction,
          facets,
          {
            ...page,
            offset: page.offset + page.limit,
          }
        );
        return await loop(acc.concat(arr.entities), {
          ...arr.page,
          offset: arr.page.offset,
        });
      }
    };
    const coeliEntities = await loop(firstBatch.entities, firstBatch.page);

    return { ...firstBatch, entities: coeliEntities };
  };
  getEntityBySlug = async <T>(
    language: AcceptedLanguage,
    entity: string,
    slug: string,
    mapFunction: (ce: Entity) => T
  ): Promise<T> => {
    return await this.coeliFetch<Entity, T>(
      `/${entity}/slugs/${slug}`,
      language,
      'GET',
      (e) => mapFunction(formattedEntity(language, e))
    );
  };
  getEntityById = async <T>(
    language: AcceptedLanguage,
    entity: string,
    id: string,
    mapFunction: (ce: Entity) => T
  ): Promise<T> => {
    return await this.coeliFetch<Entity, T>(
      `/${entity}/${id}`,
      language,
      'GET',
      (e) => mapFunction(formattedEntity(language, e))
    );
  };
  getEntities = async <T>(
    language: AcceptedLanguage,
    entity: string,
    mapFunction: (ce: Entity) => T
  ): Promise<GetResponse<T>> => {
    const coeliEntityGetResponse = await this.coeliFetch<
      GetResponse<Entity>,
      GetResponse<T>
    >(`/${entity}/`, language, 'GET', (x: GetResponse<Entity>) => {
      return {
        ...x,
        entities: x.entities
          .map((e) => formattedEntity(language, e as Entity))
          .map(mapFunction),
      };
    });
    return coeliEntityGetResponse;
  };
}
