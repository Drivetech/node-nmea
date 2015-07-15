"use strict"

import Chance from "chance"
import moment from "moment"
import {XRegExp} from "xregexp"
import pad from "underscore.string/pad"

/**
 * Get checksum from raw data
 *
 * @param {string} data - raw data
 * @return {string} checksum en hex
 */
export function getChecksum(data) {
  let checksum
  const idx1 = data.indexOf("$GP")
  const idx2 = data.indexOf("*")
  if ((idx1 >= 0) && (idx2 >= 0)) {
    const newData = data.slice(idx1 + 1, idx2)
    let sum = 0
    for (let i of newData) {
      sum = sum ^ i.charCodeAt(0)
    }
    checksum = pad(sum.toString(16).toUpperCase(), 2, "0")
  }
  return checksum
}

/**
 * Verify checksum from raw data
 *
 * @param {string} data - raw data
 * @return {boolean} if valid data
 */
export function verifyChecksum(data) {
  const idx = data.indexOf("*")
  return getChecksum(data) === data.substr(idx + 1, 2)
}

/**
 * regex for gprmc valid data
 */
const gprmc = new XRegExp(
  `^\\$GP
  (?<type> \\w{3}) \\,
  (?<time> \\d{6}[.]\\d{3}) \\,
  (?<gpsStatus> \\w{1}) \\,
  (?<latitude> \\d{4}[.]\\d{4}\\,[NS]) \\,
  (?<longitude> \\d{5}[.]\\d{4}\\,[WE]) \\,
  (?<speed> \\d{1,3}[.]\\d{1,3}) \\,
  (?<track> \\d{1,3}[.]\\d{1,3}) \\,
  (?<date> \\d{6}) \\,
  (?<magneticVariation> (\\d{1,3}[.]\\d{1})?\\,([WE])?) \\,
  (?<faa> [ADENS]) (\\*)
  (?<checkSum> \\w{2})$`, "x")

/**
 * Verify if raw data is valid
 *
 * @param {string} data - raw data
 * @return {boolean} if valid data
 */
export function isValid(data) {
  const r = XRegExp.exec(data, gprmc)
  return gprmc.test(data) && verifyChecksum(data) && r.gpsStatus === "A"
}

/**
 * Decimal latitude to degree [dmm]
 *
 * @param {string} data - raw data
 * @return {string} degree [dmm]
 */
export function latToDmm(data) {
  const decimal = Math.abs(data)
  const degree = Math.floor(decimal)
  const dd = pad(degree, 2, "0")
  const mm = pad(((decimal - degree) * 60.0).toFixed(4), 7, "0")
  const sign = data < 0 ? "S" : "N"
  return `${dd}${mm},${sign}`
}

/**
 * Decimal longitude to degree [dmm]
 *
 * @param {string} data - raw data
 * @return {string} degree [dmm]
 */
export function lngToDmm(data) {
  const decimal = Math.abs(data)
  const degree = Math.floor(decimal)
  const dd = pad(degree, 3, "0")
  const mm = pad(((decimal - degree) * 60.0).toFixed(4), 7, "0")
  const sign = data < 0 ? "W" : "E"
  return `${dd}${mm},${sign}`
}

/**
 * Degree [dmm] to decimal
 *
 * @param {string} data - Degree in dmm.
 * @return {number} decimals
 */
export function degToDec(data) {
  let decimal = 0.0

  if (data) {
    const [degree, sign] = data.split(",")
    if (degree && sign) {
      decimal = parseInt(degree / 100) + (parseFloat(degree) % 100) / 60

      if ((sign === "S") || (sign === "W")) {
        decimal *= -1
      }
    }
  }
  return decimal
}

/**
 * Knots to Km/h
 *
 * @param {string} data - knots
 * @return {number} km/h
 */
export function knotsToKmh(knots) {
  let kmh = 0.0
  if (knots) {
    kmh = parseFloat(knots) * 1.852
  }
  return kmh
}

/**
 * km/h to knots
 *
 * @param {number} data - km/h
 * @return {number} knots
 */
export function kmhToKnots(kmh) {
  let knots = 0.0
  if (kmh) {
    knots = kmh / 1.852
  }
  return knots
}

/**
 * FAA modes
 *
 */
export const faaModes = {
  A: "Autonomous",
  D: "Differential",
  E: "Estimated",
  M: "Manual input",
  S: "Simulated",
  N: "Not Valid",
  P: "Precise"
}

/**
 * Parse raw data
 *
 * @param {string} raw - raw data
 * @return {object} data parse
 */
export function parse(raw) {
  const r = XRegExp.exec(raw, gprmc)
  const datetime = `${r.date} ${r.time} +00:00`
  return {
    raw: raw,
    type: r.type,
    datetime: moment(datetime, "DDMMYY HHmmss.SSS ZZ").toDate(),
    loc: {
      type: "Point",
      coordinates: [
        degToDec(r.longitude),
        degToDec(r.latitude)
      ]
    },
    speed: knotsToKmh(r.speed),
    track: r.track,
    magneticVariation: r.magneticVariation,
    mode: faaModes[r.faa]
  }
}

/**
 * Generate random data
 *
 * @return {object} raw data parse
 */
export function randomData() {
  const chance = new Chance()
  const now = moment()
  const time = now.format("HHmmss.SSS")
  const gpsStatus = "A"
  const lat = chance.floating({min: -90, max: 90})
  const lng = chance.floating({min: -180, max: 180})
  const latitude = latToDmm(lat)
  const longitude = lngToDmm(lng)
  const speed = chance.floating({min: 0, max: 300}).toFixed(2)
  const track = chance.floating({min: 0, max: 40}).toFixed(2)
  const date = now.format("DDMMYY")
  const mvValue = chance.floating({min: 0, max: 40}).toFixed(1)
  const mvSign = chance.string({pool: "WE", length: 1})
  const mv = `${mvValue},${mvSign}`
  const magneticVariation = chance.pick([mv, ","])
  const faa = "A"
  const data = [
    `$GPRMC,${time},${gpsStatus},${latitude},${longitude},${speed},`,
    `${track},${date},${magneticVariation},${faa}*`
  ].join("")
  const checkSum = getChecksum(data)
  const raw = `${data}${checkSum}`
  return {
    raw: raw,
    time: time,
    gpsStatus: gpsStatus,
    latitude: latitude,
    longitude: longitude,
    speed: speed,
    track: track,
    date: date,
    magneticVariation: magneticVariation,
    faa: faa,
    checkSum: checkSum
  }
}
