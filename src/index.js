'use strict';

const pad = (n, width, z) => {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

/**
 * Get checksum from raw data
 *
 * @param {string} data - raw data
 * @return {string} checksum en hex
 */
const getChecksum = data => {
  let checksum;
  const idx1 = data.indexOf('$GP');
  const idx2 = data.indexOf('*');
  checksum = data.slice(idx1 + 1, idx2).split('').reduce((y, x) => y ^ x.charCodeAt(0), 0);
  return checksum;
};

/**
 * Verify checksum from raw data
 *
 * @param {string} data - raw data
 * @return {boolean} if valid data
 */
const verifyChecksum = data => {
  const idx = data.indexOf('*');
  return getChecksum(data) === parseInt(data.substr(idx + 1, 2), 16);
};

/**
 * regex for GPRMC valid data
 */
const gprmc = /^\$GP(\w{3})\,(\d{6}([.]\d+)?)\,([AV])\,(\d{4}([.]\d+)?\,[NS])\,(\d{5}([.]\d+)?\,[WE])\,(\d{1,3}[.]\d{1,3})?\,(\d{1,3}[.]\d{1,3})?\,(\d{6})\,((\d{1,3}[.]\d{1,3})?\,([WE])?)\,?([ADENS])?\*([0-9A-F]{2})$/;

/**
 * regex for GPGGA valid data
 */
const gpgga = /^\$GP(\w{3})\,(\d{6}([.]\d+)?)\,(\d{4}[.]\d+\,[NS])\,(\d{5}[.]\d+\,[WE])\,([0-8])\,(\d{1,2})\,(\d{1,3}[.]\d{1,3})?\,([-]?\d+([.]\d+)?)?\,M?\,([-]?\d+([.]\d+)?)?\,M?\,(\d+([.]\d+)?)?\,(\d{4})?\,?([ADENS])?\*([0-9A-F]{2})$/;

/**
 * Verify if raw data is valid
 *
 * @param {string} data - raw data
 * @return {boolean} if valid data
 */
const isValid = data => {
  return gprmc.test(data) && verifyChecksum(data);
};

/**
 * Decimal latitude to degree [dmm]
 *
 * @param {string} data - raw data
 * @return {string} degree [dmm]
 */
const latToDmm = data => {
  const tmp = data.toString().split('.');
  const deg = pad(Math.abs(tmp[0]), 2, '0');
  const mim = pad((('0.' + (tmp[1] || 0)) * 60).toFixed(4), 7, '0');
  const sign = data < 0 ? 'S' : 'N';
  return `${deg}${mim},${sign}`;
};

/**
 * Decimal longitude to degree [dmm]
 *
 * @param {string} data - raw data
 * @return {string} degree [dmm]
 */
const lngToDmm = data => {
  const tmp = data.toString().split('.');
  const deg = pad(Math.abs(tmp[0]), 3, '0');
  const mim = pad((('0.' + (tmp[1] || 0)) * 60).toFixed(4), 7, '0');
  const sign = data < 0 ? 'W' : 'E';
  return `${deg}${mim},${sign}`;
};

/**
 * Degree [dmm] to decimal
 *
 * @param {string} data - Degree in dmm.
 * @return {number} decimals
 */
const degToDec = data => {
  let decimal = 0.0;
  const _data = data.match(/(\d{2,3})(\d{2}[.]\d+)\,([NSWE])/).slice(1);
  const deg = _data[0];
  const min = _data[1];
  const sign = _data[2];
  decimal = parseFloat(deg) + parseFloat(min) / 60;
  if ((sign === 'S') || (sign === 'W')) {
    decimal *= -1;
  }
  return decimal;
};

/**
 * Knots to Km/h
 *
 * @param {string} data - knots
 * @return {number} km/h
 */
const knotsToKmh = knots => parseFloat(knots) * 1.852;

/**
 * km/h to knots
 *
 * @param {number} data - km/h
 * @return {number} knots
 */
const kmhToKnots = kmh => {
  let knots = 0.0;
  if (kmh) {
    knots = kmh / 1.852;
  }
  return knots;
};

/**
 * FAA modes
 *
 */
const faaModes = {
  A: 'Autonomous',
  D: 'Differential',
  E: 'Estimated',
  M: 'Manual input',
  S: 'Simulated',
  N: 'Not Valid',
  P: 'Precise'
};

const gpsQualities = {
  '0': 'Invalid',
  '1': 'GPS fix (SPS)',
  '2': 'DGPS fix',
  '3': 'PPS fix',
  '4': 'Real Time Kinematic',
  '5': 'Float RTK',
  '6': 'estimated (dead reckoning) (2.3 feature)',
  '7': 'Manual input mode',
  '8': 'Simulation mode'
};

/**
 * Parse GPRMC raw data
 *
 * @param {string} raw - raw data
 * @return {object} data parse
 */
const parseRmc = raw => {
  let data = {raw: raw, valid: false};
  const r = gprmc.exec(raw);
  if (isValid(raw)) {
    data.type = r[1];
    const datetime = `${r[11]}${r[2]}`;
    const pattern = /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})[.]\d{1,3}/;
    data.datetime = new Date(datetime.replace(pattern, '20$3-$2-$1T$4:$5:$6.000Z'));
    data.loc = {
      geojson: {
        type: 'Point',
        coordinates: [
          degToDec(r[7]),
          degToDec(r[5])
        ]
      },
      dmm: {
        latitude: r[5],
        longitude: r[7]
      }
    };
    data.gps = r[4] === 'A';
    data.speed = {
      knots: r[9] ? parseFloat(r[9]) : null,
      kmh: r[9] ? knotsToKmh(r[9]) : null
    };
    data.track = r[10] ? parseFloat(r[10]) : null;
    data.magneticVariation = r[12] === ',' ? null : r[12];
    data.mode = r[15] ? faaModes[r[15]] : null;
    data.valid = true;
  }
  return data;
};

/**
 * Parse GPGGA raw data
 *
 * @param {string} raw - raw data
 * @return {object} data parse
 */
const parseGga = raw => {
  let data = {raw: raw, valid: false};
  const r = gpgga.exec(raw);
  data.raw = raw;
  data.type = r[1];
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const pattern = /(\d{2})(\d{2})(\d{2})[.](\d{1,3})/;
  data.datetime = new Date(`${date}T${r[2].replace(pattern, '$1:$2:$3')}.000Z`);
  data.loc = {
    geojson: {
      type: 'Point',
      coordinates: [
        degToDec(r[5]),
        degToDec(r[4])
      ]
    },
    dmm: {
      latitude: r[4],
      longitude: r[5]
    }
  };
  data.gpsQuality = gpsQualities[r[6]];
  data.satellites = parseInt(r[7], 10);
  data.hdop = r[8] ? parseFloat(r[8]) : null;
  data.altitude = r[9] ? parseFloat(r[9]) : null;
  data.geoidalSeparation = r[11] ? parseFloat(r[11]) : null;
  data.ageGpsData = r[13] ? parseFloat(r[13]) : null;
  data.refStationId = r[15];
  data.valid = verifyChecksum(r[0]);
  return data;
};

const parse = raw => {
  let data = {raw: raw, valid: false};
  if (gprmc.test(raw)) {
    data = parseRmc(raw);
  } else if (gpgga.test(raw)) {
    data = parseGga(raw);
  }
  return data;
};

module.exports = {
  getChecksum: getChecksum,
  verifyChecksum: verifyChecksum,
  gprmc: gprmc,
  isValid: isValid,
  latToDmm: latToDmm,
  lngToDmm: lngToDmm,
  degToDec: degToDec,
  knotsToKmh: knotsToKmh,
  kmhToKnots: kmhToKnots,
  faaModes: faaModes,
  parseRmc: parseRmc,
  parseGga: parseGga,
  parse: parse
};
