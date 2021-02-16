import { AcceptedLanguage } from './coeliApi';
declare type PrimitiveValueMetadata = {
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
declare type PrimitiveValueType = 'ValueType';
interface ReferenceMetadata {
    $type: {
        $type: string;
        references: string;
    };
}
declare type Token = WithValue<string>;
interface PartialReference {
    href: string;
    label?: Token;
    $metadata: ReferenceMetadata;
}
declare type Reference = HasProperties & PartialReference;
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
declare type PartialEntity = {
    $metadata: EntityMetadata;
};
export declare type Entity = PartialEntity & HasProperties;
export declare function formattedEntity(locale: AcceptedLanguage, e: Entity): Entity;
export {};
