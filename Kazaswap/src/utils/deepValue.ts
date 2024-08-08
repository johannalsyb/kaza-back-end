// access nested values with dot notation
// i.e. deep_value({a: {b: {c: 1}}}, "a.b.c") => 1
export const deep_value = (obj: any, path: string) =>
  path
    .replace(/\[|\]\.?/g, '.')
    .split('.')
    .filter(s => s)
    .reduce((acc, val) => acc && acc[val], obj);
