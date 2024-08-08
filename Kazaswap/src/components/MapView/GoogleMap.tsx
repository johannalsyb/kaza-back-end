/// <reference types="@types/google.maps" />
import React, {useEffect, useState, useRef} from 'react';
import {MapProps} from '.';
import useConfig from '../../hooks/useConfig';
import {useNavigation} from '@react-navigation/native';
import {NavStackParamList} from '../../navigation/screens';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import properties from '../../api/properties';

declare global {
  interface Window {
    initMap: any;
  }
}

window.initMap = () => {
  // console.log("map loaded");
};

const loadScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!document.getElementById('google-map-script')) {
      const script = document.createElement('script');
      script.id = 'google-map-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      script.async = true;
      document.body.appendChild(script);
    }
    if (!window.google) {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    } else resolve();
  });
};

const GoogleMap: React.FC<MapProps> = ({
  style,
  lat,
  lng,
  apiKey,
  zoom,
  lines,
  linesStyles,
  points,
  pointsStyles,
  circles,
  circleStyles,
}) => {
  const [map, setMap] = useState<google.maps.Map>();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<NavStackParamList, 'Properties', undefined>
    >();
  const ref = useRef<HTMLDivElement>(null);
  const {config} = useConfig();

  const handleMarkerHover = (
    marker: google.maps.Marker,
    property: Property,
    svgMarker?: string,
  ) => {
    marker.addListener('mouseover', async () => {
      marker.setIcon({
        url: svgMarker || '/pin.svg',
        origin: new google.maps.Point(-10, -30),
      });
    });

    marker.addListener('click', () => {
      navigation.navigate('Property', {id: property.id, property});
    });

    marker.addListener('mouseout', () => {
      marker.setIcon('/pin.svg');
    });
  };

  const init = () => {
    if(!window.google) return
    if(!ref.current) return;
    const m = new google.maps.Map(ref.current, {
      center: new google.maps.LatLng(lat || 53.4084, lng || -2.98333),
      zoom: zoom || 5,
      // mapTypeId: "satellite",
      clickableIcons: false,
      disableDefaultUI: true,
      zoomControl: true,
    });

    if (lines && lines.length) {
      lines.forEach((lineCoords, i) => {
        const lineStyle = linesStyles && linesStyles[i] ? linesStyles[i] : {};
        const options = {
          path: lineCoords,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2,
          ...lineStyle,
        };
        const path = new google.maps.Polyline(options);
        path.setMap(m);
      });
    }

    if (points && points.length) {
      points.forEach(async (point, i) => {
        const pointStyle =
          pointsStyles && pointsStyles[i] ? pointsStyles[i] : {};
        const latlng = new google.maps.LatLng(point.lat, point.lng);
        const marker = new google.maps.Marker({
          position: latlng,
          icon: `/pin.svg`,
        });
        marker.setMap(m);
        if(point.property) {
          const svg = properties.pictures.getCardPictureUrl(point.property?.id)
          handleMarkerHover(marker, point.property, svg);
        }
      });
    }

    if (circles && circles.length) {
      circles.forEach((point, i) => {
        const latlng = new google.maps.LatLng(point.lat, point.lng);
        const circle = new google.maps.Circle({
          strokeColor: '#FF0000',
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          center: latlng,
          radius: point.radius,
        });
        circle.setMap(m);
      });
    }
    setMap(m);
    return m;
  };

  useEffect(() => {
    if (!apiKey && config) apiKey = config.keys.gmaps;
    if (apiKey) {
      loadScript(apiKey).then(() => {
        if (ref.current && !map) {
          init()
        }
      });
    }
  }, [config]);

  useEffect(() => {
    if(ref.current) init();
  }, [lat, lng, zoom]);

  return (
    <>
      <div style={{...(style || {})}} className="map" ref={ref} />
      {/* <div ref={kmlRef} id="capture" /> */}
    </>
  );
};

export default GoogleMap;
