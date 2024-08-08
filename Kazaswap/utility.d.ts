// add `& (string | number)` to the keyof ObjectType
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

declare global {
  interface String {
    capitalize(): string;
    toCamelCase(): string;
    toKebabCase(): string;
    capitalizeFirst(): string;
  }
}