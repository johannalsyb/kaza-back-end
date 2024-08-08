import { ScaledSize, useWindowDimensions } from 'react-native';

export type Config = ScaledSize & {
    isMobile: boolean
}

const useIsMobile = ():Config => {
  const dims = useWindowDimensions();
  let isMobile = false;
  if(dims.width < 768) {
    isMobile = true
  }

  return {...dims, isMobile};
};

export default useIsMobile;
