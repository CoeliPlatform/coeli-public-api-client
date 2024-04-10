"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoeliApi = void 0;
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const formatUtils_1 = require("./formatUtils");
class CoeliApi {
    constructor(tenant, token) {
        this.coeliFetch = (partialUrl_1, language_1, ...args_1) => __awaiter(this, [partialUrl_1, language_1, ...args_1], void 0, function* (partialUrl, language, method = 'GET', mapFunction, body) {
            const url = `https://api.coeli.cat/coeli/${this.tenant}${partialUrl}`;
            const headers = {
                'Accept-Language': language,
                Authorization: `Authorization ${this.token}`,
                'Content-Language': language,
                'Content-Type': 'application/json',
            };
            const requestInit = {
                body: JSON.stringify(body),
                headers,
                method,
            };
            try {
                const response = yield (0, isomorphic_fetch_1.default)(url, requestInit);
                if (response.status >= 400) {
                    throw new Error(`An error occurred trying to request Coeli api, url:\n ${url}\n with status ${response.status}, ${response.statusText}: \n${JSON.stringify(requestInit)}`);
                }
                const jsonResponse = (yield response.json());
                return mapFunction(jsonResponse);
            }
            catch (e) {
                console.trace(`Error in GET ${url}`, e);
            }
        });
        this.createControlledSearch = (language, entity, search) => __awaiter(this, void 0, void 0, function* () {
            return yield this.coeliFetch(`/${entity}/search`, language, 'POST', (x) => x, search);
        });
        this.getControlledSearch = (language, controlledSearchResponse, mapFunction, facets, page, facetModes) => __awaiter(this, void 0, void 0, function* () {
            const partialUrl = `/${controlledSearchResponse.entityTypeName}/search/${controlledSearchResponse.id}${facets
                ? `?${page
                    ? `limit=${page.limit}&offset=${page.offset}`
                    : 'limit=25&offset=0'}` +
                    '&facet=' +
                    facets.join(',')
                : `?${page
                    ? `limit=${page.limit}&offset=${page.offset}`
                    : 'limit=25&offset=0'}`}${facetModes ? '&facetMode=' + facetModes.join(',') : ''}`;
            const getSearchResponse = yield this.coeliFetch(partialUrl, language, 'GET', (x) => x);
            return mapFunction(Object.assign(Object.assign(Object.assign({}, getSearchResponse), {
                entities: getSearchResponse.entities.map((e) => (0, formatUtils_1.formattedEntity)(language, e)),
                facets: (0, formatUtils_1.formattedFacets)(getSearchResponse.facets),
            }), { url: '/' + controlledSearchResponse.self.href.split('/').slice(3).join('/') }));
        });
        this.createAndGetControlledSearch = (language, entity, search, mapFunction, facets, page, facetModes) => __awaiter(this, void 0, void 0, function* () {
            const controlledSearchResponse = yield this.createControlledSearch(language, entity, search);
            return yield this.getControlledSearch(language, controlledSearchResponse, mapFunction, facets, page, facetModes);
        });
        this.createControlledSearchAndGetAllItems = (language, entity, search, mapFunction, facets, page) => __awaiter(this, void 0, void 0, function* () {
            const controlledSearchResponse = yield this.createControlledSearch(language, entity, search);
            const firstBatch = yield this.getControlledSearch(language, controlledSearchResponse, mapFunction, facets, page || {
                limit: 200,
                maxOffset: 0,
                offset: 0,
                total: 0,
            });
            const loop = (acc, page) => __awaiter(this, void 0, void 0, function* () {
                if (page.offset + page.limit > page.maxOffset) {
                    return acc;
                }
                else if (page.offset + page.limit > page.total) {
                    return acc;
                }
                else {
                    const arr = yield this.getControlledSearch(language, controlledSearchResponse, mapFunction, facets, Object.assign(Object.assign({}, page), { offset: page.offset + page.limit }));
                    return yield loop(acc.concat(arr.entities), Object.assign(Object.assign({}, arr.page), { offset: arr.page.offset }));
                }
            });
            const coeliEntities = yield loop(firstBatch.entities, firstBatch.page);
            return Object.assign(Object.assign({}, firstBatch), { entities: coeliEntities });
        });
        this.getEntityBySlug = (language, entity, slug, mapFunction) => __awaiter(this, void 0, void 0, function* () {
            return yield this.coeliFetch(`/${entity}/slugs/${slug}`, language, 'GET', (e) => mapFunction((0, formatUtils_1.formattedEntity)(language, e)));
        });
        this.getEntityById = (language, entity, id, mapFunction) => __awaiter(this, void 0, void 0, function* () {
            return yield this.coeliFetch(`/${entity}/${id}`, language, 'GET', (e) => mapFunction((0, formatUtils_1.formattedEntity)(language, e)));
        });
        this.getEntities = (language, entity, mapFunction) => __awaiter(this, void 0, void 0, function* () {
            const search = { conditions: [] };
            return yield this.createAndGetControlledSearch(language, entity, search, mapFunction);
        });
        this.tenant = tenant;
        this.token = token;
    }
}
exports.CoeliApi = CoeliApi;
