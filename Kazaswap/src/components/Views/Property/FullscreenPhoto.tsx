import KText from '../../KText';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import variables from '../../../styles/variables';
import KIcon from '../../KIcon/KIcon';
import KImage from '../../KImage/KImage';
import {useEffect, useState} from 'react';
import useIsMobile from '../../../hooks/useIsMobile';
import Carousel from '../../Carousel';

type Props = {
  property: Property;
  visible: boolean;
  index?: number;
  setVisible: (visible: boolean) => void;
};

export default ({
  property,
  visible = false,
  setVisible,
  index = 0,
}: Props) => {
  const [photoDisplayedIndex, setPhotoDisplayedIndex] = useState(index);
  const {isMobile} = useIsMobile();
  let {images, id} = property;
  const imagesArray = [...new Set(images.split(','))];

  const {width, height} = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (photoDisplayedIndex > 0)
          setPhotoDisplayedIndex(photoDisplayedIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (photoDisplayedIndex < imagesArray.length - 1)
          setPhotoDisplayedIndex(photoDisplayedIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [photoDisplayedIndex]);

  useEffect(() => {
    setPhotoDisplayedIndex(index);
  }, [index]);

  const imageViews = imagesArray.map((image, i) => {
    return (<Pressable
      onPress={() => setVisible(false)}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
      }}>
        <Pressable onPress={() => {
          // DO NOTHING
        }}>
          <KImage
            imageId={`${id}/${image}`}
            type="properties"
            style={{
              height: height-50,
              objectFit: "contain",
              pointerEvents: "all",
            }}
          />
        </Pressable>
      </Pressable>
    );
  })

  if (!property?.owner) return <KText>Loading...</KText>;
  else {
    return (
      <Modal
        visible={visible}
        transparent={true}
        onRequestClose={() => setVisible(false)}
        onPointerUp={e => {
          console.log(e)
        }}>
        <TouchableOpacity
          onPress={() => setVisible(false)}
          style={[styles.modalOverlay]}></TouchableOpacity>
        
        <View
          style={[
            styles.container,
            isMobile && {padding: variables.spacing.xsmall},
          ]}>
          {/* <KIcon
            name="close"
            size="large"
            style={{
              position: 'relative',
              alignSelf: 'flex-end',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: 'white',
              borderRadius: 50,
              marginBottom: 10,
              color: 'white',
              opacity: 0.5,
              pointerEvents: "all",
            }}
            onPress={() => setVisible(false)}
          /> */}

          <Carousel
            data={imageViews}
            style={{
              width: "100%",
              height: "90%",
              display: "flex",
              flex: 1
            }}
            />
          

          {/* <KImage
            imageId={`${id}/${imagesArray[photoDisplayedIndex]}`}
            type="properties"
            style={{
              width: '100%',
              aspectRatio: 620 / 380,
              borderRadius: 20,
              objectFit: 'contain',
              pointerEvents: "all",
            }}
          /> */}
          <View style={styles.controls}>
            <KIcon
              style={styles.arrow}
              name="chevronLeft"
              size="xxlarge"
              onPress={() => {
                if (photoDisplayedIndex > 0) setPhotoDisplayedIndex(photoDisplayedIndex - 1);
                else setPhotoDisplayedIndex(imagesArray.length - 1);
              }}
            />
            {/* <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {imagesArray.map((image, i) => {
                return (
                  <View
                    key={`fullscreenshoto_${i}`}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 50,
                      backgroundColor:
                        photoDisplayedIndex === i
                          ? variables.colors.yellow
                          : 'transparent',
                      borderWidth: 1,
                      borderColor: variables.colors.yellow,
                      margin: 5,
                    }}
                  />
                );
              })}
            </View> */}
            <KIcon
              style={styles.arrow}
              name="chevronRight"
              size="xxlarge"
              onPress={() => {
                if (photoDisplayedIndex < imagesArray.length - 1) setPhotoDisplayedIndex(photoDisplayedIndex + 1);
                else setPhotoDisplayedIndex(0);
              }}
            />
          </View>
        </View>
      </Modal>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    height: '100%',
    justifyContent: 'center',
    flex: 1,
    pointerEvents: "none",
    display: "flex",
    width: '100%',
    // zIndex: -1,
  },
  modalOverlay: {
    backgroundColor: variables.colors.black,
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    opacity: 0.8,
    zIndex: 0,
    cursor: "initial",
  },
  lightText: {
    opacity: 0.5,
    width: '100%',
    textAlign: 'center',
    color: 'white',
  },
  controls: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingTop: 20,
    zIndex: 2,
    display: "none"
  },
  arrow: {
    backgroundColor: variables.colors.yellow,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    pointerEvents: "all",
  },
});
