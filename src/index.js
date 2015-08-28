"use strict"

import Chance from "chance"
import moment from "moment"
import {XRegExp} from "xregexp"

/**
 * Get checksum from raw data
 *
 * @param {string} data - raw data
 * @return {string} checksum en hex
 */
function getChecksum(data) {
  let checksum
  const chance = new Chance()
  const idx1 = data.indexOf("$GP")
  const idx2 = data.indexOf("*")
  if ((idx1 >= 0) && (idx2 >= 0)) {
    const newData = data.slice(idx1 + 1, idx2)
    let sum = 0
    for (let i = 0; i < newData.length; i++) {
      sum = sum ^ newData[i].charCodeAt(0)
    }
    checksum = chance.pad(sum.toString(16).toUpperCase(), 2)
  }
  return checksum
}

/**
 * Verify checksum from raw data
 *
 * @param {string} data - raw data
 * @return {boolean} if valid data
 */
function verifyChecksum(data) {
  const idx = data.indexOf("*")
  return getChecksum(data) === data.substr(idx + 1, 2)
}

const params = {
  type: /\w{3}/,
  time: /\d{6}[.]\d{3}/,
  gpsStatus: /[AV]/,
  latitude: /\d{4}[.]\d{4}\,[NS]/,
  longitude: /\d{5}[.]\d{4}\,[WE]/,
  speed: /(\d{1,3}[.]\d{1,3})?/,
  track: /(\d{1,3}[.]\d{1,3})?/,
  date: /\d{6}/,
  magneticVariation: /(\d{1,3}[.]\d{1,3})?\,([WE])?/,
  faa: /([ADENS])?/,
  gprmcCheckSum: /\w{2}/
}

/**
 * regex for gprmc valid data
 */
const gprmc = XRegExp.build(`(?x)^
  \\$GP ({{type}}) \\,
  ({{time}}) \\,
  ({{gpsStatus}}) \\,
  ({{latitude}}) \\,
  ({{longitude}}) \\,
  ({{speed}}) \\,
  ({{track}}) \\,
  ({{date}}) \\,
  ({{magneticVariation}})
  (\\,)?
  ({{faa}}) \\*
  ({{gprmcCheckSum}})$`, params)

/**
 * Verify if raw data is valid
 *
 * @param {string} data - raw data
 * @return {boolean} if valid data
 */
function isValid(data) {
  const r = XRegExp.exec(data, gprmc)
  return gprmc.test(data) && verifyChecksum(data)
}

/**
 * Decimal latitude to degree [dmm]
 *
 * @param {string} data - raw data
 * @return {string} degree [dmm]
 */
function latToDmm(data) {
  const chance = new Chance()
  const decimal = Math.abs(data)
  const degree = Math.floor(decimal)
  const dd = chance.pad(degree, 2)
  const mm = chance.pad(((decimal - degree) * 60.0).toFixed(4), 7)
  const sign = data < 0 ? "S" : "N"
  return `${dd}${mm},${sign}`
}

/**
 * Decimal longitude to degree [dmm]
 *
 * @param {string} data - raw data
 * @return {string} degree [dmm]
 */
function lngToDmm(data) {
  const chance = new Chance()
  const decimal = Math.abs(data)
  const degree = Math.floor(decimal)
  const dd = chance.pad(degree, 3)
  const mm = chance.pad(((decimal - degree) * 60.0).toFixed(4), 7)
  const sign = data < 0 ? "W" : "E"
  return `${dd}${mm},${sign}`
}

/**
 * Degree [dmm] to decimal
 *
 * @param {string} data - Degree in dmm.
 * @return {number} decimals
 */
function degToDec(data) {
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
function knotsToKmh(knots) {
  let kmh = null
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
function kmhToKnots(kmh) {
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
const faaModes = {
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
function parse(raw) {
  let data = {raw: raw, valid: false}
  const r = XRegExp.exec(raw, gprmc)
  if (isValid(raw)) {
    const datetime = `${r.date} ${r.time} +00:00`
    const track = r.track === "" ? null : r.track
    const mv = r.magneticVariation === "," ? null : r.magneticVariation
    data.raw = raw
    data.type = r.type
    data.datetime = moment(datetime, "DDMMYY HHmmss.SSS ZZ").toDate()
    data.loc = {
      type: "Point",
      coordinates: [
        degToDec(r.longitude),
        degToDec(r.latitude)
      ]
    }
    data.gps = r.gpsStatus === "A"
    data.speed = knotsToKmh(r.speed)
    data.track = track
    data.magneticVariation = mv
    data.mode = r.faa ? faaModes[r.faa] : null,
    data.valid = true
  }
  return data
}

/**
 * Generate random data
 *
 * @return {object} raw data parse
 */
function randomData(opts = {}) {
  let time, date, gpsStatus, latitude, longitude, speed, track, magneticVariation, faa
  const chance = new Chance()

  if ((opts.datetime !== undefined) && moment(opts.datetime).isValid()) {
    time = moment(opts.datetime).format("HHmmss.SSS")
    date = moment(opts.datetime).format("DDMMYY")
  } else {
    const now = moment()
    time = now.format("HHmmss.SSS")
    date = now.format("DDMMYY")
  }

  if (params.gpsStatus.test(opts.gpsStatus)) {
    gpsStatus = opts.gpsStatus
  } else {
    gpsStatus = "A"
  }

  if ((opts.latitude >= -90) && (opts.latitude <= 90)) {
    latitude = latToDmm(opts.latitude)
  } else {
    latitude = latToDmm(chance.floating({min: -90, max: 90}))
  }

  if ((opts.longitude >= -180) && (opts.longitude <= 180)) {
    longitude = lngToDmm(opts.longitude)
  } else {
    longitude = lngToDmm(chance.floating({min: -180, max: 180}))
  }

  if ((opts.speed >= 0) && (opts.speed <= 300)) {
    speed = opts.speed.toFixed(2)
  } else {
    speed = chance.floating({min: 0, max: 300}).toFixed(2)
  }

  if ((opts.track >= 0) && (opts.track <= 40)) {
    track = opts.track.toFixed(2)
  } else {
    track = chance.floating({min: 0, max: 40}).toFixed(2)
  }

  if (params.magneticVariation.test(opts.magneticVariation)) {
    magneticVariation = opts.magneticVariation
  } else {
    const mvValue = chance.floating({min: 0, max: 40}).toFixed(1)
    const mvSign = chance.string({pool: "WE", length: 1})
    const mv = `${mvValue},${mvSign}`
    magneticVariation = opts.magneticVariation || chance.pick([mv, ","])
  }

  if (opts.faa === undefined) {
    faa = "A"
  } else if (params.faa.test(opts.faa)) {
    faa = opts.faa
  } else {
    faa = "A"
  }

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

export default {
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
  parse: parse,
  randomData: randomData
}
