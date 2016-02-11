# node-nmea

[![npm version](https://img.shields.io/npm/v/node-nmea.svg?style=flat-square)](https://www.npmjs.com/package/node-nmea)
[![npm downloads](https://img.shields.io/npm/dm/node-nmea.svg?style=flat-square)](https://www.npmjs.com/package/node-nmea)
[![Build Status](https://img.shields.io/travis/lgaticaq/node-nmea.svg?style=flat-square)](https://travis-ci.org/lgaticaq/node-nmea)
[![devDependency Status](https://img.shields.io/david/dev/lgaticaq/node-nmea.svg?style=flat-square)](https://david-dm.org/lgaticaq/node-nmea#info=devDependencies)
[![Join the chat at https://gitter.im/lgaticaq/node-nmea](https://img.shields.io/badge/gitter-join%20chat%20%E2%86%92-brightgreen.svg?style=flat-square)](https://gitter.im/lgaticaq/node-nmea?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Parser for NMEA sentences.

Available sentences:
* GPRMC - recommended minimum data for gps

Example: `$GPRMC,161006.425,A,7855.6020,S,13843.8900,E,154.89,84.62,110715,173.1,W,A*30`

Where:

Value         | Definition
--------------| ----------
RMC           | Recommended Minimum sentence C
161006.425    | Fix taken at 16:10:06.425 UTC
A             | Status A=active or V=Void.
7855.6020,S   | Latitude 78 deg 55.6020' N
13843.8900,E  | Longitude 138 deg 43.8900' E
154.89        | Speed over the ground in knots
84.62         | Track angle in degrees True
110715        | Date - 11 of July 2015
173.1,W       | Magnetic Variation in degrees (- West Declination, + East Declination)
A             | FAA Mode A=autonomous, D=differential, E=estimated (dead-reckoning), M=manual input, S=simulated, N=data not valid, P=precise (4.00 and later)
\*30          | The checksum data, always begins with \*

## Installation

```bash
$ npm install node-nmea
```

## Use

[Try on Tonic](https://tonicdev.com/npm/node-nmea)
```js
import nmea from "node-nmea"

const raw = '$GPRMC,161006.425,A,7855.6020,S,13843.8900,E,154.89,84.62,110715,173.1,W,A*30'
const data = nmea.parse(raw)
data.valid // true
data.raw // '$GPRMC,161006.425,A,7855.6020,S,13843.8900,E,154.89,84.62,110715,173.1,W,A*30'
data.type // 'RMC'
data.gps // true
data.datetime // Sat Jul 11 2015 13:10:06 GMT-0300 (CLT)
data.loc // { geojson: { type: 'Point', coordinates: [ 138.7315, -78.9267 ] }, dmm: { latitude: '7855.6020,S', longitude: '13843.8900,E' } }
data.speed // { knots: 154.89, kmh: 286.85627999999997 }
data.track // '84.62'
data.magneticVariation // '173.1,W'
data.mode // 'Autonomous'
```
