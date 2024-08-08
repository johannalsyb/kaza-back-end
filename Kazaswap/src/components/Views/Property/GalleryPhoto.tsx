import KText from '../../KText';
import {View, StyleSheet, Pressable} from 'react-native';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import variables from '../../../styles/variables';
import KIcon from '../../KIcon/KIcon';
import Gap from '../../Gap/Gap';
import KImage from '../../KImage/KImage';
import {useState} from 'react';
import FullscreenPhoto from './FullscreenPhoto';
import useIsMobile from '../../../hooks/useIsMobile';

type Props = {
  property?: Property;
};

const limit = 5

export default ({property}: Props) => {
  // const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [fullScreen, setFullScreen] = useState<number>(-1);
  const {isMobile} = useIsMobile();

  if (!property?.owner) return <KText>Loading...</KText>;
  else {
    let {images, id} = property;
    // images = Array.isArray(images) ? images.join(',') : images;

    const uniqueImages = [...new Set(images.split(','))];
    return (
      <View
        style={[
          styles.container,
          {
            flexDirection: isMobile ? 'column-reverse' : 'column',
          },
        ]}>
        {isMobile && (
          <>
            <Pressable
              style={{
                aspectRatio: 370 / 45,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                backgroundColor: variables.colors.white,
                borderRadius: 100,
              }}
              onPress={() => setFullScreen(0)}>
              <KText style={{
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
              }}>
                View more photos
                <KIcon name="image" size="medium" style={{stroke: "black"}}/>

              </KText>
            </Pressable>
            <Gap size="xsmall" vertical />
          </>
        )}
        <Pressable onPress={() => setFullScreen(0)}>
          <KImage
            imageId={`${id}/${uniqueImages[0]}`}
            type="properties"
            style={{
              width: '100%',
              aspectRatio: 620 / 380,
              borderRadius: 20,
              objectFit: 'cover',
            }}
          />
        </Pressable>
        <Gap size={isMobile ? 'xxsmall' : 'small'} vertical />
        <View
          style={[
            {
              flexDirection: 'row',
              justifyContent: isMobile ? "space-between" : 'flex-start',
              aspectRatio: isMobile ? 2 : 4,
              width: '100%',
            },
          ]}>
          {uniqueImages.slice(1, isMobile ? 3 : 4).map((image, i) => {
            // if (isMobile ? i > 0 && i < 3 : i < 4) {
              return (
                <Pressable
                  key={`image-${i}`}
                  style={{
                    height: isMobile ? '98%' : '98%',
                    borderRadius: 20,
                    aspectRatio: 1,
                    marginRight: isMobile ? 0 : 5,
                  }}
                  onPress={() => {
                    setFullScreen(i+1)
                  }}>
                  <KImage
                    imageId={`${id}/${image}`}
                    type="properties"
                    style={{
                      aspectRatio: 1,
                      borderRadius: 20,
                      objectFit: 'cover',
                    }}
                  />
                </Pressable>
              );
            // }
          })}

          {(!isMobile && uniqueImages.length > limit) && (
            <Pressable
              onPress={() => setFullScreen(0)}
              style={{
                height: isMobile ? '98%' : '98%',
                borderRadius: 20,
                aspectRatio: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <KImage
                    imageId={`${id}/${uniqueImages[limit-1]}`}
                    type="properties"
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: 20,
                      objectFit: 'cover',
                    }}
                  />
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  borderRadius: 20,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: variables.colors.black+"aa",
                }}>
                  <KIcon name="image" size="medium" />
                  <KText style={styles.lightText}>View more</KText>
                </View>
            </Pressable>
          )}
        </View>
        <FullscreenPhoto
          property={property}
          visible={fullScreen >= 0}
          index={fullScreen}
          setVisible={() => setFullScreen(-1)}
        />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    display: 'flex',
  },
  lightText: {
    opacity: 0.5,
    width: '100%',
    textAlign: 'center',
    color: 'white',
  },
});
