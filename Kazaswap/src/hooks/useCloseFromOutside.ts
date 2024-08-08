import {useEffect, useRef} from 'react';
import {Platform, View} from 'react-native';
import {useClickOutside} from 'react-native-click-outside';

// This hook is used to close some component (via setOpen(false)) when a user
// presses/clicks outside of another component thats bound to the
// closeFromOutsideRef.

// When using this hook in conjunction with a modal, the modal can
// re-open incorrectly. Pass the nativeID of the pressable to
// overrideElementId that opens/closes the modal to ensure the modal
// opens and closes correctly.

export const useCloseFromOutside = (
  isOpen: boolean,
  setIsOpen: (isOpen: boolean, e?: MouseEvent | TouchEvent) => void,
  overrideElementId = undefined,
) => {
  let closeFromOutsideRef = useRef<View | null>(null);
  const nativeRef = useClickOutside<View>(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const checkIsOutside = (e: MouseEvent | TouchEvent) => {
      const overrideElementClicked =
        (e.target as HTMLElement)?.id === overrideElementId ||
        (e.target as HTMLElement).parentElement?.id === overrideElementId;

      if (
        isOpen &&
        closeFromOutsideRef.current &&
        //@ts-ignore
        !closeFromOutsideRef.current.contains(e.target as HTMLElement) &&
        !overrideElementClicked
      ) {
        setIsOpen(false, e);
      }
    };

    document.addEventListener('mousedown', checkIsOutside);

    return () => {
      document.removeEventListener('mousedown', checkIsOutside);
    };
  }, [isOpen]);

  if (Platform.OS !== 'web') {
    closeFromOutsideRef = nativeRef;
  }

  return closeFromOutsideRef;
};
