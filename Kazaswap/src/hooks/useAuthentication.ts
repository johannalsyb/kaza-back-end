import React, {useEffect, useState} from 'react';
import auth from '../api/auth';
import {propertiesAtom, userAtom} from '../atoms';
import {useAtomValue, useSetAtom} from 'jotai';
import {Api, User} from '@kazaswap/common';
import {toastError, toastSuccess, toastWarning} from '../components/Toast/Toast';
import UserEvent from '../events/UserEvent';
import { SwapRequest } from '@kazaswap/common/lib/types/api/swap';
import swaps from '../api/swaps';
import Property from '@kazaswap/common/lib/types/Property';
import {ofUser} from '../api/properties';
import users from '../api/users';
import Notification from '@kazaswap/common/lib/types/Notification';

const TIMEOUT_SEC = 60

export type Authentication = {
  logout: () => void;
  login: (email: string, password: string) => Promise<User | null>;
  check: (set?:boolean, repeat?:boolean) => Promise<User | void>;
  updateUser: (user: Partial<User>) => void;
  user?: User;
  isAuthLoading: boolean;
  isAdmin: boolean;
  requests: {
    reload: () => Promise<SwapRequest[]>,
    get: () => Promise<SwapRequest[]>,
  },
  properties: {
    reload: (changeHidden?:boolean) => Promise<Property[]>,
    get: () => Promise<Property[]>,
  },
  notifications: {
    get: () => Promise<Notification[]>,
    read: (notificationId:string) => Promise<string>,
    readAll: () => Promise<string[]>,
  }
};

const useAuthentication = ():Authentication => {
  const [user, setUser] = [useAtomValue(userAtom), useSetAtom(userAtom)];
  const [properties, setProperties] = [useAtomValue(propertiesAtom), useSetAtom(propertiesAtom)]
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [requests, setRequests] = useState<SwapRequest[]>()
  const [timeout, setTimeoutRef] = useState<NodeJS.Timeout>()
  const userRef = React.useRef(user)

  useEffect(() => {
    if(userRef.current !== user) {
      if(user) {
        // console.log("User logged in")
        new UserEvent("login").emit(user)
        if(timeout) clearInterval(timeout)
        check(false, true) // Check every 60 seconds
      }
      else {
        // console.log("User logged out")
        new UserEvent("logout").emit({})
        if(timeout) clearInterval(timeout)
      }
    }
  }, [user])

  const logout: Authentication['logout'] = () => {
    auth
      .logout()
      .then(() => {
        setUser(undefined);
        if(timeout) clearTimeout(timeout)
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  };

  const login: Authentication['login'] = async (email, password) => {
    try {
      const res = await auth.login(email, password)
      const user = await check(true)
      if(!user) throw new Error("Login failed")
      return user
      // toastSuccess('Login successful');
    } catch(err){
      // TODO: Handle error
      console.log(err);
      toastError('Login failed');
      return null
    } finally {
      setIsAuthLoading(false);
    }
  };

  const check: Authentication['check'] = (set = false, repeat = false) => {
    return auth
      .me()
      .then(res => {
        if(res.data.unreadNotifications !== undefined) {
          new UserEvent("notification").emit({unreadNotifications: res.data.unreadNotifications})
        }

        if(res.data.newMatches !== undefined) {
          new UserEvent("match").emit({newMatches: res.data.newMatches})
        }
        if(set) setUser(res.data);
        return res.data
      })
      .catch(err => {
        // TODO: Handle error
        // console.log(err);
      })
      .finally(() => {
        setIsAuthLoading(false);
        // if(repeat) {
        //   setTimeoutRef(setTimeout(() => {
        //     check(set, user && repeat)
        //   }, 1000*TIMEOUT_SEC))
        // }
      });
  };

  const updateUser = (u:Partial<User>) => setUser({...user, ...u as User})

  const req = {
    reload: ():Promise<SwapRequest[]> => {
      return swaps.requests.all()
      .then(res => {
        setRequests(res.data)
        return res.data
      })
      .catch(err => {
        console.log(err)
        setRequests([])
        return []
      })
    },
    get: () => !requests ? req.reload() : Promise.resolve(requests)
  }

  const props = {
    reload: (changeHidden?:boolean):Promise<Property[]> => {
      if(!user) return Promise.resolve([])
      return ofUser("me")
      .then(res => {
        if(changeHidden !== undefined) {
          const fn = !changeHidden ? toastSuccess : toastWarning
          fn(`Your property is now ${!changeHidden ? "visible" : "hidden"}`, "Property visibility")
        }
        setProperties(res.data)
        return res.data
      })
      .catch(err => {
        console.log(err)
        setProperties([])
        return []
      })
    },
    get: () => !properties ? props.reload() : Promise.resolve(properties)
  }

  const notifs = {
    get: () => users.me.notifications.all()
      .then(res => res.data),
    read: (notificationId:string) => users.me.notifications.read(notificationId)
      .then(res => {
        new UserEvent("notification").emit({unreadNotifications: user && user.unreadNotifications!-1 > 0 ? user.unreadNotifications!-1 : 0})
        return res.data
      })
      .catch(err => {
        console.log(err)
        return ""
      }),
    readAll: () => users.me.notifications.readAll()
    .then(res => {
      new UserEvent("notification").emit({unreadNotifications: 0})
      return res.data
    })
  }


  return {
    isAuthLoading,
    user,
    logout,
    login,
    check,
    updateUser,
    requests: req,
    properties: props,
    isAdmin: !!(user && (user.role === "admin" || user.role === "superadmin")),
    notifications: notifs
  };
};

export default useAuthentication;
