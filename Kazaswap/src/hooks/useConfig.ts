import React, {useEffect, useState} from 'react';
import auth from '../api/auth';
import {configAtom, showOverlayAtom} from '../atoms';
import {useAtomValue, useSetAtom} from 'jotai';
import {Api, User} from '@kazaswap/common';
import {toastError, toastSuccess} from '../components/Toast/Toast';
import apiConfig from '../api/config';
import { View } from 'react-native';

export type Config = {
  config: Api.Config.Response | undefined,
  load: () => Promise<Api.Config.Response>;
  overlay: false | string;
};

const useConfig = ():Config => {
  const [config, setConfig] = [useAtomValue(configAtom), useSetAtom(configAtom)];
  const [overlay, setOverlay] = [useAtomValue(showOverlayAtom), useSetAtom(showOverlayAtom)];

  const load = () => {
    return apiConfig.get()
      .then(c => {
        setConfig(c.data)

        if(c.data.maintenanceMessage) {
          setOverlay(c.data.maintenanceMessage)
        }

        return c.data
      })
  };

  return {config, load, overlay};
};

export default useConfig;
