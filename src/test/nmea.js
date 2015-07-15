"use strict"

import * as nmea from "../"
import assert from "assert"
import moment from "moment"

describe("Nmea", () => {
  const data = nmea.randomData()
  const parser = nmea.parse(data.raw)

  describe("#this.raw", () => {
    it("should return the same value passed in the constructor", () => {
      assert.equal(data.raw, parser.raw)
    })
  })

  describe("#this.isValid()", () => {
    it("should return true if checksum is valid", () => {
      assert.equal(true, nmea.isValid(parser.raw))
    })
  })

  describe("#this.datetime", () => {
    it("should return true if datetime values is valid", () => {
      const datetime = moment.utc(parser.datetime)
      const date = datetime.format("DDMMYY")
      assert.equal(data.date, date)
      const time = datetime.format("HHmmss.SSS")
      assert.equal(data.time, time)
    })
  })

  describe("#this.loc", () => {
    it("should return true if position values is valid", () => {
      assert.equal("Point", parser.loc.type)
      assert.equal(2, parser.loc.coordinates.length)
      const lng = nmea.lngToDmm(parser.loc.coordinates[0])
      const lat = nmea.latToDmm(parser.loc.coordinates[1])
      assert.equal(data.latitude, lat)
      assert.equal(data.longitude, lng)
    })
  })
})
