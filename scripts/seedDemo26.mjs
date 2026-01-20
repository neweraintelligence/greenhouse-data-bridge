import { seedSession } from '../src/lib/seedSession.js';

console.log('Seeding DEMO26 session...');

seedSession('DEMO26')
  .then(() => {
    console.log('✓ DEMO26 session seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Error seeding DEMO26:', error);
    process.exit(1);
  });
