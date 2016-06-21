'use strict';

import nmea from '../lib';
import {expect} from 'chai';
import moment from 'moment';

describe('Nmea', () => {
  describe('GPRMC', () => {
    const data = '$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C';
    const parser = nmea.parse(data);

    it('should return the same value passed in the constructor', () => {
      expect(data).to.eql(parser.raw);
    });

    it('should return true if checksum is valid', () => {
      expect(nmea.isValid(parser.raw)).to.be.true;
    });

    it('should return true if datetime values is valid', () => {
      const datetime = moment.utc(parser.datetime);
      const date = datetime.format('DDMMYY');
      expect(date).to.eql('090216');
      const time = datetime.format('HHmmss.SSS');
      expect(time).to.eql('194329.000');
    });

    it('should return true if position values is valid', () => {
      expect(parser.loc.geojson.type).to.eql('Point');
      expect(parser.loc.geojson.coordinates.length).to.eql(2);
      expect(parser.loc.dmm.latitude).to.eql('3321.6735,S');
      expect(parser.loc.dmm.longitude).to.eql('07030.7640,W');
    });

    it('should return true if gps value is valid', () => {
      expect(parser.gps).to.be.true;
    });

    it('should return true if speed value is valid', () => {
      expect(parser.speed.knots).to.eql(0);
      expect(parser.speed.kmh).to.eql(0);
    });

    it('should return true if track value is valid', () => {
      expect(parser.track).to.eql('0.00');
    });

    it('should return true if magnetic variation value is valid', () => {
      expect(parser.magneticVariation).to.be.null;
    });

    it('should return true if mode value is valid', () => {
      expect(parser.mode).to.eql('Autonomous');
    });
  });

  describe('GPRMC alternative', () => {
    const data = '$GPRMC,192053.00,A,4212.63658,N,00844.30075,W,0.648,295.88,010616,,,A*76';
    const parser = nmea.parse(data);

    it('should return the same value passed in the constructor', () => {
      expect(data).to.eql(parser.raw);
    });

    it('should return true if checksum is valid', () => {
      expect(nmea.isValid(parser.raw)).to.be.true;
    });

    it('should return true if datetime values is valid', () => {
      const datetime = moment.utc(parser.datetime);
      const date = datetime.format('DDMMYY');
      expect(date).to.eql('010616');
      const time = datetime.format('HHmmss');
      expect(time).to.eql('192053');
    });

    it('should return true if position values is valid', () => {
      expect(parser.loc.geojson.type).to.eql('Point');
      expect(parser.loc.geojson.coordinates.length).to.eql(2);
      expect(parser.loc.dmm.latitude).to.eql('4212.63658,N');
      expect(parser.loc.dmm.longitude).to.eql('00844.30075,W');
    });

    it('should return true if gps value is valid', () => {
      expect(parser.gps).to.be.true;
    });

    it('should return true if speed value is valid', () => {
      expect(parser.speed.knots).to.eql(0.648);
      expect(parser.speed.kmh).to.eql(1.200096);
    });

    it('should return true if track value is valid', () => {
      expect(parser.track).to.eql('295.88');
    });

    it('should return true if magnetic variation value is valid', () => {
      expect(parser.magneticVariation).to.be.null;
    });

    it('should return true if mode value is valid', () => {
      expect(parser.mode).to.eql('Autonomous');
    });
  });

  describe('GPGGA', () => {
    const data = '$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F';
    const parser = nmea.parse(data);

    it('should return the same value passed in the constructor', () => {
      expect(data).to.eql(parser.raw);
    });

    it('should return true if checksum is valid', () => {
      expect(nmea.verifyChecksum(parser.raw)).to.be.true;
    });

    it('should return true if datetime value is valid', () => {
      const datetime = moment.utc(parser.datetime);
      const time = datetime.format('HHmmss');
      expect(time).to.eql('172814');
    });

    it('should return true if position value is valid', () => {
      expect(parser.loc.geojson.type).to.eql('Point');
      expect(parser.loc.geojson.coordinates.length).to.eql(2);
      expect(parser.loc.dmm.latitude).to.eql('3723.46587704,N');
      expect(parser.loc.dmm.longitude).to.eql('12202.26957864,W');
    });

    it('should return true if gps quality value is valid', () => {
      expect(parser.gpsQuality).to.eql('DGPS fix');
    });

    it('should return true if satellites value is valid', () => {
      expect(parser.satellites).to.eql(6);
    });

    it('should return true if hdop value is valid', () => {
      expect(parser.hdop).to.eql(1.2);
    });

    it('should return true if altitude values is valid', () => {
      expect(parser.altitude).to.eql(18.893);
    });

    it('should return true if geoidal separation values is valid', () => {
      expect(parser.geoidalSeparation).to.eql(-25.669);
    });

    it('should return true if age Gps Data values is valid', () => {
      expect(parser.ageGpsData).to.eql(2);
    });

    it('should return true if reference station id values is valid', () => {
      expect(parser.refStationId).to.eql('0031');
    });
  });
});
