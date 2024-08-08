import {Property} from '@kazaswap/common/lib/types/api/properties';
import Map from './GoogleMap';

type LineStyle = {
  strokeColor: string;
};

type CircleStyles = {
  strokeColor: string;
  fillColor: string;
};

export type MapProps = {
  lat?: number;
  lng?: number;
  style?: React.CSSProperties;
  apiKey?: string;
  zoom?: number;
  lines?: {lat: number; lng: number}[][];
  linesStyles?: LineStyle[];
  points?: {lat: number; lng: number; property?: Property}[];
  pointsStyles?: (React.CSSProperties & {weight?: number})[];
  circles?: {lat: number; lng: number; radius: number}[];
  circleStyles?: CircleStyles[];
  onMapCreated?: () => void;
};

export default Map;
