import { uuid } from "../utils";

type PropertySearchEventListener = (search:string) => void;
const psel = new Map<string, PropertySearchEventListener>();

export default class Event {
    static addListener = (listener: PropertySearchEventListener) => {
        const id = uuid();
        psel.set(id, listener);
        return id
    }
    
    static removeListener = (uuid:string) => {
        psel.delete(uuid);
    }
    
    public emit(search: string) {
        psel.forEach(l => l(search));
    }
}
