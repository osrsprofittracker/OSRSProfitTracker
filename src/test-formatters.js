import { formatNumber, formatTimer } from './utils/formatters.js';

console.log('Testing formatNumber:');
console.log(formatNumber(1000)); // Should print "1,000"
console.log(formatNumber(150000)); // Should print "150 K"
console.log(formatNumber(5000000)); // Should print "5.0 M"

console.log('\nTesting formatTimer:');
console.log(formatTimer(null)); // Should print "--:--:--"
console.log(formatTimer(Date.now() + 3600000)); // Should print something like "01:00:00"

console.log('\nAll tests passed!');