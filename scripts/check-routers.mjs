import { appRouter } from '../server/routers.js';

const procedures = appRouter._def.procedures;
const procedureNames = Object.keys(procedures).sort();

console.log('Total procedures:', procedureNames.length);
console.log('\nProcedure names:');
console.log(procedureNames.join(', '));

console.log('\n\nChecking specific routers:');
const checkRouters = ['auth', 'user', 'project', 'task', 'dashboard', 'notification', 'comment', 'attachment'];
for (const name of checkRouters) {
  console.log(`- ${name}:`, procedures[name] ? '✓' : '✗');
}
