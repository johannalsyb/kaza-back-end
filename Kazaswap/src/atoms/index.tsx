import {Api, User} from '@kazaswap/common';
import {atom} from 'jotai';
import { Component, ReactNode } from 'react';
import Property from '@kazaswap/common/lib/types/Property';

export const userAtom = atom<User | undefined>(undefined);
export const propertiesAtom = atom<Property[] | undefined>(undefined);
export const configAtom = atom<Api.Config.Response | undefined>(undefined);

export const showHeaderAtom = atom<boolean>(true);

export const showSwapNowAtom = atom<boolean>(false);
export const showSignInAtom = atom<boolean>(false);
export const showMessageAtom = atom<string | null>(null);
export const showComponentAtom = atom<ReactNode | null>(null);

export const showOverlayAtom = atom<false | string>(false);