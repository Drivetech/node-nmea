'use strict'

const { describe, it } = require('mocha')
const nmea = require('../src')
const expect = require('chai').expect

describe('Nmea', () => {
  describe('GPRMC', () => {
    const data =
      '$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C'
    const parser = nmea.parse(data)

    it('should return the same value passed in the constructor', () => {
      expect(data).to.eql(parser.raw)
    })

    it('should return true if checksum is valid', () => {
      expect(nmea.isValid(parser.raw)).to.eql(true)
    })

    it('should return true if position values is valid', () => {
      expect(parser.loc.geojson.type).to.eql('Point')
      expect(parser.loc.geojson.coordinates.length).to.eql(2)
      expect(parser.loc.dmm.latitude).to.eql('3321.6735,S')
      expect(parser.loc.dmm.longitude).to.eql('07030.7640,W')
    })

    it('should return true if gps value is valid', () => {
      expect(parser.gps).to.eql(true)
    })

    it('should return true if speed value is valid', () => {
      expect(parser.speed.knots).to.eql(0)
      expect(parser.speed.kmh).to.eql(0)
    })

    it('should return true if track value is valid', () => {
      expect(parser.track).to.eql(0.0)
    })

    it('should return true if magnetic variation value is valid', () => {
      expect(parser.magneticVariation).to.eql(null)
    })

    it('should return true if mode value is valid', () => {
      expect(parser.mode).to.eql('Autonomous')
    })
  })

  describe('GPRMC alternative', () => {
    const data =
      '$GPRMC,192053.00,A,4212.63658,N,00844.30075,W,0.648,295.88,010616,,,A*76'
    const parser = nmea.parse(data)

    it('should return the same value passed in the constructor', () => {
      expect(data).to.eql(parser.raw)
    })

    it('should return true if checksum is valid', () => {
      expect(nmea.isValid(parser.raw)).to.eql(true)
    })

    it('should return true if position values is valid', () => {
      expect(parser.loc.geojson.type).to.eql('Point')
      expect(parser.loc.geojson.coordinates.length).to.eql(2)
      expect(parser.loc.dmm.latitude).to.eql('4212.63658,N')
      expect(parser.loc.dmm.longitude).to.eql('00844.30075,W')
    })

    it('should return true if gps value is valid', () => {
      expect(parser.gps).to.eql(true)
    })

    it('should return true if speed value is valid', () => {
      expect(parser.speed.knots).to.eql(0.648)
      expect(parser.speed.kmh).to.eql(1.200096)
    })

    it('should return true if track value is valid', () => {
      expect(parser.track).to.eql(295.88)
    })

    it('should return true if magnetic variation value is valid', () => {
      expect(parser.magneticVariation).to.eql(null)
    })

    it('should return true if mode value is valid', () => {
      expect(parser.mode).to.eql('Autonomous')
    })

    it('should return data GPRMC with empty fields', () => {
      const data =
        '$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,,,090216,173.1,W,*50'
      const parser = nmea.parse(data)
      expect(parser.speed.knots).to.eql(null)
      expect(parser.speed.kmh).to.eql(null)
      expect(parser.track).to.eql(null)
      expect(parser.magneticVariation).to.eql('173.1,W')
      expect(parser.mode).to.eql(null)
    })
  })

  describe('GPGGA', () => {
    const data =
      '$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F'
    const parser = nmea.parse(data)

    it('should return the same value passed in the constructor', () => {
      expect(data).to.eql(parser.raw)
    })

    it('should return true if checksum is valid', () => {
      expect(nmea.verifyChecksum(parser.raw)).to.eql(true)
    })

    it('should return true if position value is valid', () => {
      expect(parser.loc.geojson.type).to.eql('Point')
      expect(parser.loc.geojson.coordinates.length).to.eql(2)
      expect(parser.loc.dmm.latitude).to.eql('3723.46587704,N')
      expect(parser.loc.dmm.longitude).to.eql('12202.26957864,W')
    })

    it('should return true if gps quality value is valid', () => {
      expect(parser.gpsQuality).to.eql('DGPS fix')
    })

    it('should return true if satellites value is valid', () => {
      expect(parser.satellites).to.eql(6)
    })

    it('should return true if hdop value is valid', () => {
      expect(parser.hdop).to.eql(1.2)
    })

    it('should return true if altitude values is valid', () => {
      expect(parser.altitude).to.eql(18.893)
    })

    it('should return true if geoidal separation values is valid', () => {
      expect(parser.geoidalSeparation).to.eql(-25.669)
    })

    it('should return true if age Gps Data values is valid', () => {
      expect(parser.ageGpsData).to.eql(2)
    })

    it('should return true if reference station id values is valid', () => {
      expect(parser.refStationId).to.eql('0031')
    })

    it('should return data GPGGA with empty fields', () => {
      const data =
        '$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,,,,,,,0031*4F'
      const parser = nmea.parse(data)
      expect(parser.hdop).to.eql(null)
      expect(parser.altitude).to.eql(null)
      expect(parser.geoidalSeparation).to.eql(null)
      expect(parser.ageGpsData).to.eql(null)
    })
  })

  describe('Extras', () => {
    it('should return latitude in dmm', () => {
      expect(nmea.latToDmm(-33.38113666666667)).to.eql('3322.8682,S')
      expect(nmea.lngToDmm(-70.77628166666666)).to.eql('07046.5769,W')
      expect(nmea.latToDmm(-33)).to.eql('3300.0000,S')
      expect(nmea.lngToDmm(-70)).to.eql('07000.0000,W')
      expect(nmea.latToDmm(33)).to.eql('3300.0000,N')
      expect(nmea.lngToDmm(70)).to.eql('07000.0000,E')
      expect(nmea.kmhToKnots()).to.eql(0.0)
      expect(nmea.kmhToKnots(100)).to.eql(53.99568034557235)
    })
  })

  describe('Error', () => {
    it('should return invalid data', () => {
      const data =
        'GGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031'
      const parser = nmea.parse(data)
      expect(parser.raw).to.eql(data)
      expect(parser.valid).to.eql(false)
    })
    it('should return invalid data', () => {
      const data =
        '$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6F'
      const parser = nmea.parse(data)
      expect(parser.raw).to.eql(data)
      expect(parser.valid).to.eql(false)
    })
  })
})
