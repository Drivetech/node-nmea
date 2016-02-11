'use strict';

import nmea from '../lib';
import {expect} from 'chai';
import moment from 'moment';

describe('Nmea', () => {
  const data = '$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C';
  const parser = nmea.parse(data);

  describe('#this.raw', () => {
    it('should return the same value passed in the constructor', () => {
      expect(data).to.eql(parser.raw);
    });
  });

  describe('#this.isValid()', () => {
    it('should return true if checksum is valid', () => {
      expect(nmea.isValid(parser.raw)).to.be.true;
    });
  });

  describe('#this.datetime', () => {
    it('should return true if datetime values is valid', () => {
      const datetime = moment.utc(parser.datetime);
      const date = datetime.format('DDMMYY');
      expect(date).to.eql('090216');
      const time = datetime.format('HHmmss.SSS');
      expect(time).to.eql('194329.000');
    });
  });

  describe('#this.loc', () => {
    it('should return true if position values is valid', () => {
      expect(parser.loc.type).to.eql('Point');
      expect(parser.loc.coordinates.length).to.eql(2);
      const lng = nmea.lngToDmm(parser.loc.coordinates[0]);
      const lat = nmea.latToDmm(parser.loc.coordinates[1]);
      expect(lat).to.eql('3321.6735,S');
      expect(lng).to.eql('07030.7640,W');
    });
  });
});
