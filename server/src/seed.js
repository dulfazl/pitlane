import { seedDemo } from './seed-data.js';

seedDemo();

console.log('Seeded PITLANE demo data:');
console.log('  Customers: Arjun Menon (9847012345), Fathima Rasheed (9745098765), Vishnu Prasad (9656011223)');
console.log('  Vehicles : KL18AB1234, KL18CD5678, KL18EF9012, KL11GH3456');
console.log('  Staff PIN:', process.env.STAFF_PIN || '4321');
