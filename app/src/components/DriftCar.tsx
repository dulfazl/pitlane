import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Low side-view coupe in brand orange — same silhouette as the splash artwork.
export function DriftCar({ width = 260 }: { width?: number }) {
  const height = (width * 180) / 660;
  return (
    <Svg width={width} height={height} viewBox="0 0 660 180">
      <Defs>
        <LinearGradient id="carBody" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#E04E00" />
          <Stop offset="1" stopColor="#FF8A2A" />
        </LinearGradient>
      </Defs>
      <Path
        fill="url(#carBody)"
        d="M 30,140
           C 22,130 20,114 26,106
           C 32,98 40,94 54,92
           C 62,74 74,60 100,54
           C 160,32 240,30 310,42
           C 340,46 370,58 402,72
           C 480,76 550,84 598,94
           C 624,99 640,106 644,114
           C 648,122 646,132 638,140
           L 610,144
           C 606,118 586,100 560,100
           C 534,100 514,118 510,144
           L 206,144
           C 202,118 182,100 156,100
           C 130,100 110,118 106,144
           L 38,144
           Z"
      />
      <Path fill="#0A0A0A" opacity={0.92} d="M 128,58 C 180,40 250,38 306,48 L 370,70 L 260,74 L 150,72 Z" />
      <Rect x="220" y="114" width="270" height="7" rx="3.5" fill="#0A0A0A" opacity={0.25} />
      <Circle cx="156" cy="144" r="34" fill="#0D0D0D" stroke="#2E2E2E" strokeWidth="5" />
      <Circle cx="156" cy="144" r="13" fill="none" stroke="#FF6A00" strokeWidth="5" />
      <Circle cx="560" cy="144" r="34" fill="#0D0D0D" stroke="#2E2E2E" strokeWidth="5" />
      <Circle cx="560" cy="144" r="13" fill="none" stroke="#FF6A00" strokeWidth="5" />
      <Path d="M 610,100 L 636,108" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" opacity={0.9} />
    </Svg>
  );
}
