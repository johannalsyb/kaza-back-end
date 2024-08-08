import { User } from "@kazaswap/common";
import { uuid } from "../utils";

export type UserEventType = "login" | "logout" | "update" | "notification" | "match"

type UserEventListener = (user:Partial<User>) => void;
const userEventListeners = new Map<UserEventType, {uuid:string, listener: UserEventListener}[]>();

class UserEvent {
    static addListener = (event: UserEventType, listener: UserEventListener) => {
        const id = uuid();
        userEventListeners.has(event) ? userEventListeners.get(event)?.push({uuid: id, listener}) : userEventListeners.set(event, [{uuid: id, listener}]);
        return id
    }
    
    static removeListener = (event: UserEventType, uuid:string) => {
        userEventListeners.has(event) && userEventListeners.set(event, userEventListeners.get(event)?.filter(l => l.uuid !== uuid) || []);
    }
    
    private type:UserEventType
    constructor(type: UserEventType) {
        this.type = type;
    }
    
    public emit(user: Partial<User>) {
        userEventListeners.get(this.type)?.forEach(l => l.listener(user));
    }
}

export default UserEvent;