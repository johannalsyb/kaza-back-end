import { uuid } from "../utils";

type HeaderEventTypes = "search" | "edit" | "home" | "back" | "share";
type HeaderEventListener = (data?:string) => void;
const psel = new Map<HeaderEventTypes, {id: string, fn: HeaderEventListener}[]>();

export default class HeaderEvent {
    static addListener = (type: HeaderEventTypes, listener: HeaderEventListener) => {
        const id = uuid();
        if(!psel.has(type)) psel.set(type, []);
        psel.get(type)!.push({id, fn: listener});
        return id
    }
    
    static removeListener = (type: HeaderEventTypes, uuid:string) => {
        if(!psel.has(type)) psel.set(type, [])
        psel.set(type, psel.get(type)!.filter(l => l.id !== uuid))
    }
    
    static emit(type:HeaderEventTypes, data: string) {
        (psel.get(type) || []).forEach(({id, fn}) => fn(data));
    }
}
