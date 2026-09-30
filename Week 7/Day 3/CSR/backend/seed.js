const bcrypt = require('bcrypt');
const { updateDatabase } = require('./db');

async function main() {
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'CleanWater2026!';
  const sponsorPassword = process.env.DEMO_SPONSOR_PASSWORD || 'Impact2026!';
  const residentPassword = process.env.DEMO_RESIDENT_PASSWORD || 'Resident2026!';
  const passwords = await Promise.all([adminPassword, sponsorPassword, residentPassword].map((password) => bcrypt.hash(password, 10)));
  await updateDatabase((database) => {
    database.users = [
      { id: 'demo-admin', name: 'Amina Otieno', email: 'admin@mtaaclean.test', passwordHash: passwords[0], phone: '+254 700 000 101', role: 'admin', location: 'Githogoro' },
      { id: 'demo-sponsor', name: 'Kijani Industries', email: 'sponsor@mtaaclean.test', passwordHash: passwords[1], phone: '+254 700 000 202', role: 'sponsor', location: 'Nairobi' },
      { id: 'demo-resident', name: 'Wanjiku Njeri', email: 'resident@mtaaclean.test', passwordHash: passwords[2], phone: '+254 700 000 303', role: 'resident', location: 'Githogoro, Zone A' },
      { id: 'demo-collector', name: 'Samuel Maina', email: 'collector@mtaaclean.test', passwordHash: passwords[0], phone: '+254 700 000 404', role: 'collector', location: 'Githogoro' }
    ];
    database.reports = [
      { id: 'report-001', title: 'Blocked drainage', description: 'Plastic waste and soil have blocked the channel beside the footbridge. Water is pooling after rain.', problemType: 'blocked-drainage', location: 'Githogoro, Zone A · Footbridge', image: '', status: 'pending', reportedBy: 'demo-resident', reportedByName: 'Wanjiku Njeri', assignedTo: null, createdAt: new Date().toISOString(), updates: [{ status: 'pending', note: 'Report received and awaiting review.', at: new Date().toISOString() }] },
      { id: 'report-002', title: 'Illegal dumping', description: 'Household rubbish is being left beside the drainage channel and is attracting pests.', problemType: 'illegal-dumping', location: 'Githogoro, Zone B · Market lane', image: '', status: 'verified', reportedBy: 'demo-resident', reportedByName: 'Wanjiku Njeri', assignedTo: 'demo-collector', createdAt: new Date(Date.now() - 86400000).toISOString(), updates: [{ status: 'verified', note: 'Location verified by the community team.', at: new Date().toISOString() }] }
    ];
    database.cleanups = [{ id: 'cleanup-001', title: 'Githogoro channel & lane cleanup', location: 'Githogoro · Zone A', date: '2026-10-10', time: '09:00', wasteTargetKg: 500, volunteers: ['demo-resident'], impact: null, createdAt: new Date().toISOString() }];
    database.projects = [{
      id: 'project-001', name: 'Githogoro Drainage Cleanup',
      description: 'Clear blocked channels and establish reliable waste collection points in Githogoro Zone A before the long rains.',
      location: 'Githogoro, Zone A', fundingRequired: 75000, amountRaised: 25000, sponsorIds: ['demo-sponsor'],
      activities: ['Waste collection', 'Drainage cleaning', 'Protective equipment', 'Community education'],
      status: 'funded', impact: { cleanups: 2, volunteers: 38, wasteCollectedKg: 420, drainageSections: 4, wasteBinsProvided: 6 },
      createdAt: new Date().toISOString()
    }];
    database.sponsorships = [{ id: 'sponsor-001', projectId: 'project-001', projectName: 'Githogoro Drainage Cleanup', sponsorId: 'demo-sponsor', companyName: 'Kijani Industries', amount: 25000, createdAt: new Date().toISOString() }];
  });
  console.log('MtaaClean demo data loaded.');
  console.log(`Admin: admin@mtaaclean.test / ${adminPassword}`);
  console.log(`Sponsor: sponsor@mtaaclean.test / ${sponsorPassword}`);
  console.log(`Resident: resident@mtaaclean.test / ${residentPassword}`);
  console.log(`Collector: collector@mtaaclean.test / ${adminPassword}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});