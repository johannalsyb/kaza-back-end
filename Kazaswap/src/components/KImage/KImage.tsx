import React, {useEffect} from 'react';
import useConfig from '../../hooks/useConfig';
import variables from '../../styles/variables';

type Props = {
  source?: string;
  style?: React.CSSProperties;
  defaultSource?: string;
  imageId?: string;
  type?: 'properties' | 'users';
  thumbnail?: boolean;
};

const KImage = ({
  source,
  imageId,
  thumbnail = false,
  type,
  style,
  defaultSource = variables.images.defaultImage,
}: Props) => {
  const {config} = useConfig();
  if (imageId && config && type) {
    const cfg = config.images[type];
    source = `${cfg.url}${imageId}${
      thumbnail ? cfg.thumbnailSuffix : cfg.suffix
    }`;
  }
  const [imageSource, setImageSource] = React.useState(source);

  useEffect(() => {
    setImageSource(source);
  }, [source]);

  return (
    <img
      style={style}
      onError={e => {
        setImageSource(defaultSource);
      }}
      loading="lazy"
      src={imageSource}
    />
  );
};

export default KImage;
