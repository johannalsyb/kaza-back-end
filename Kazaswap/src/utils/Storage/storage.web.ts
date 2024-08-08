export const get = (key: string):string | null => {
    // @ts-ignore
    return localStorage.getItem(key);
}

export const set = (key: string, value: string):string | null => {
    // @ts-ignore
    return localStorage.setItem(key, value);
}

export const remove = (key: string):string | null => {
    // @ts-ignore
    return localStorage.removeItem(key);
}