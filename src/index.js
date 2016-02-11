'use strict';

import pad from 'pad';
import moment from 'moment';

/**
 * Get checksum from raw data
 *
 * @param {string} data - raw data
 * @return {string} checksum en hex
 */
const getChecksum = (data) => {
  let checksum;
  const idx1 = data.indexOf('$GP');
  const idx2 = data.indexOf('*');
  if ((idx1 >= 0) && (idx2 >= 0)) {
    checksum = data.slice(idx1 + 1, idx2).split('').reduce((y, x) => y ^ x.charCodeAt(0), 0);
  }
  return checksum;
};

/**
 * Verify checksum from raw data
 *
 * @param {string} data - raw data
 * @return {boolean} if valid data
 */
const verifyChecksum = (data) => {
  const idx = data.indexOf('*');
  return getChecksum(data) === parseInt(data.substr(idx + 1, 2), 16);
};

/**
 * regex for gprmc valid data
 */
const gprmc = /^\$GP(\w{3})\,(\d{6}[.]\d{3})\,([AV])\,(\d{4}[.]\d{4}\,[NS])\,(\d{5}[.]\d{4}\,[WE])\,(\d{1,3}[.]\d{1,3})?\,(\d{1,3}[.]\d{1,3})\,(\d{6})\,((\d{1,3}[.]\d{1,3})?\,([WE])?)\,?([ADENS])?\*([0-9A-F]{2})$/;

/**
 * Verify if raw data is valid
 *
 * @param {string} data - raw data
 * @return {boolean} if valid data
 */
const isValid = (data) => {
  return gprmc.test(data) && verifyChecksum(data);
};

/**
 * Decimal latitude to degree [dmm]
 *
 * @param {string} data - raw data
 * @return {string} degree [dmm]
 */
const latToDmm = (data) => {
  const tmp = data.toString().split('.');
  const deg = pad(2, Math.abs(tmp[0]), '0');
  const mim = pad(7, (('0.' + (tmp[1] || 0)) * 60).toFixed(4), '0');
  const sign = data < 0 ? 'S' : 'N';
  return `${deg}${mim},${sign}`;
};

/**
 * Decimal longitude to degree [dmm]
 *
 * @param {string} data - raw data
 * @return {string} degree [dmm]
 */
const lngToDmm = (data) => {
  const tmp = data.toString().split('.');
  const deg = pad(3, Math.abs(tmp[0]), '0');
  const mim = pad(7, (('0.' + (tmp[1] || 0)) * 60).toFixed(4), '0');
  const sign = data < 0 ? 'W' : 'E';
  return `${deg}${mim},${sign}`;
};

/**
 * Degree [dmm] to decimal
 *
 * @param {string} data - Degree in dmm.
 * @return {number} decimals
 */
const degToDec = (data) => {
  let decimal = 0.0;
  const [deg, min, sign] = data.match(/(\d{2,3})(\d{2}[.]\d{4})\,([NSWE])/).slice(1);
  if (deg && min && sign) {
    decimal = parseFloat(deg) + parseFloat(min) / 60;
    if ((sign === 'S') || (sign === 'W')) {
      decimal *= -1;
    }
  }
  return decimal;
};

/**
 * Knots to Km/h
 *
 * @param {string} data - knots
 * @return {number} km/h
 */
const knotsToKmh = (knots) => {
  let kmh = null;
  if (knots) {
    kmh = parseFloat(knots) * 1.852;
  }
  return kmh;
};

/**
 * km/h to knots
 *
 * @param {number} data - km/h
 * @return {number} knots
 */
const kmhToKnots = (kmh) => {
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

/**
 * Parse raw data
 *
 * @param {string} raw - raw data
 * @return {object} data parse
 */
const parse = (raw) => {
  let data = {raw: raw, valid: false};
  const r = gprmc.exec(raw);
  if (isValid(raw)) {
    const track = r[7] === '' ? null : r[7];
    const mv = r[9] === ',' ? null : r[9];
    data.raw = raw;
    data.type = r[1];
    data.datetime = moment(`${r[8]}${r[2]}+00:00`, 'DDMMYYHHmmss.SSSZZ').toDate();
    data.loc = {
      type: 'Point',
      coordinates: [
        degToDec(r[5]),
        degToDec(r[4])
      ]
    };
    data.gps = r[3] === 'A';
    data.speed = {
      knots: parseFloat(r[6]),
      kmh: knotsToKmh(r[6])
    };
    data.track = track;
    data.magneticVariation = mv;
    data.mode = r[12] ? faaModes[r[12]] : null;
    data.valid = true;
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
  parse: parse
};
