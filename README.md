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
173.1,W       | Magnetic Variation in degrees
A             | FAA Mode A=autonomous, D=differential, E=estimated (dead-reckoning), M=manual input, S=simulated, N=data not valid, P=precise (4.00 and later)
\*30          | The checksum data, always begins with \*

## Installation

```bash
$ npm install node-nmea
```

## Parse data

```js
import nmea from "node-nmea"

const raw = "$GPRMC,161006.425,A,7855.6020,S,13843.8900,E,154.89,84.62,110715,173.1,W,A*30"
const data = nmea.parse(raw)
data.isValid() // true
data.raw // '$GPRMC,161006.425,A,7855.6020,S,13843.8900,E,154.89,84.62,110715,173.1,W,A*30'
data.type // RMC
data.datetime // Sat Jul 11 2015 13:10:06 GMT-0300 (CLT)
data.loc // { type: 'Point', coordinates: [ 138.73149999999998, -78.9267 ] }
data.speed // 286.85627999999997
data.track // '84.62'
data.magneticVariation // '173.1,W'
data.mode // 'Autonomous'
```

## Random data

```js
import nmea from "node-nmea"

const raw = nmea.randomData()
const data = nmea.parse(raw)
data.isValid() // true
data.raw // '$GPRMC,161006.425,A,7855.6020,S,13843.8900,E,154.89,84.62,110715,173.1,W,A*30'
data.time // '161006.425'
data.gpsStatus // 'A'
data.latitude // '7855.6020,S'
data.longitude // '13843.8900,E'
data.speed // '154.89'
data.track // '84.62'
data.date // '110715'
data.magneticVariation // '173.1,W'
data.faa // 'A'
data.checkSum // '30'
```

## Random data with options

### Options

- `datetime`: Pass a date object.
- `gpsStatus`: Pass "A" for active or "V" for void.
- `latitude`: Pass a number >= -90 or <= 90.
- `longitude`: Pass a number >= -180 or <= 180.
- `speed`: Pass a number >= 0 or <= 300.
- `track`: Pass a number >= 0 or <= 40.
- `magneticVariation`: Pass a string "DD.D,[W,E]" or ",". Example "10.1,W"
- `faa`: Pass "A" for autonomous (default), "D" for differential, "E" for estimated, "M" for manual input, "S" for simulated, "N" for not valid or "P" for precise

```js
import nmea from "node-nmea"
import moment from "moment"

const opts = {
  datetime: moment("2015-07-15 17:12:00", "YYYY-MM-DD HH:mm:ss").toDate(),
  speed: 120.5,
  latitude: -33.35290037001406,
  longitude: -70.52955843508244
}
const raw = nmea.randomData(opts)
const data = nmea.parse(raw)
data.isValid() // true
data.raw // '$GPRMC,171200.000,A,3321.1740,S,7031.7735,S,120.50,38.34,150715,0.8,E,A*0C'
data.time // '171200.000'
data.gpsStatus // 'A'
data.latitude // '3321.1740,S'
data.longitude // '7031.7735,S'
data.speed // '120.50'
data.track // '38.34'
data.date // '150715'
data.magneticVariation // '0.8,E'
data.faa // 'A'
data.checkSum // '0C'
```
