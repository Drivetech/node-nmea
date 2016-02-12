const nmea = require('node-nmea');

const gprmc = '$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C';
const gpgga = '$GPGGA,120558.916,5058.7457,N,00647.0514,E,2,06,1.7,109.0,M,47.6,M,1.5,0000*71';
const dataGprmc = nmea.parse(gprmc);
const dataGpgga = nmea.parse(gpgga);
