const nmea = require('node-nmea');

const gprmc = '$GPRMC,194329.000,A,3321.6735,S,07030.7640,W,0.00,0.00,090216,,,A*6C';
nmea.parse(gprmc);
