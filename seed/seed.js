require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Province = require('../src/models/Province');
const District = require('../src/models/District');
const PoliceStation = require('../src/models/PoliceStation');
const User = require('../src/models/User');
const Driver = require('../src/models/Driver');
const Vehicle = require('../src/models/Vehicle');
const LocationPing = require('../src/models/LocationPing');

// ── Sri Lanka geographic data ────────────────────────────────────────────────

const PROVINCES = [
  { name: 'Western Province', code: 'WP' },
  { name: 'Central Province', code: 'CP' },
  { name: 'Southern Province', code: 'SP' },
  { name: 'Northern Province', code: 'NP' },
  { name: 'Eastern Province', code: 'EP' },
  { name: 'North Western Province', code: 'NWP' },
  { name: 'North Central Province', code: 'NCP' },
  { name: 'Uva Province', code: 'UP' },
  { name: 'Sabaragamuwa Province', code: 'SGP' },
];

// Districts keyed by province code
const DISTRICTS_BY_PROVINCE = {
  WP: ['Colombo', 'Gampaha', 'Kalutara'],
  CP: ['Kandy', 'Matale', 'Nuwara Eliya'],
  SP: ['Galle', 'Matara', 'Hambantota'],
  NP: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  EP: ['Ampara', 'Batticaloa', 'Trincomalee'],
  NWP: ['Kurunegala', 'Puttalam'],
  NCP: ['Anuradhapura', 'Polonnaruwa'],
  UP: ['Badulla', 'Monaragala'],
  SGP: ['Kegalle', 'Ratnapura'],
};

// Station names per district (2 per district for seed simplicity)
const STATIONS_BY_DISTRICT = {
  Colombo: ['Colombo Fort Police Station', 'Nugegoda Police Station'],
  Gampaha: ['Gampaha Police Station', 'Negombo Police Station'],
  Kalutara: ['Kalutara Police Station', 'Panadura Police Station'],
  Kandy: ['Kandy Central Police Station', 'Peradeniya Police Station'],
  Matale: ['Matale Police Station', 'Dambulla Police Station'],
  'Nuwara Eliya': ['Nuwara Eliya Police Station', 'Hatton Police Station'],
  Galle: ['Galle Fort Police Station', 'Hikkaduwa Police Station'],
  Matara: ['Matara Police Station', 'Weligama Police Station'],
  Hambantota: ['Hambantota Police Station', 'Tangalle Police Station'],
  Jaffna: ['Jaffna Central Police Station', 'Chavakachcheri Police Station'],
  Kilinochchi: ['Kilinochchi Police Station', 'Paranthan Police Station'],
  Mannar: ['Mannar Police Station', 'Uyilankulam Police Station'],
  Mullaitivu: ['Mullaitivu Police Station', 'Oddusuddan Police Station'],
  Vavuniya: ['Vavuniya Police Station', 'Cheddikulam Police Station'],
  Ampara: ['Ampara Police Station', 'Kalmunai Police Station'],
  Batticaloa: ['Batticaloa Police Station', 'Valaichchenai Police Station'],
  Trincomalee: ['Trincomalee Police Station', 'Kinniya Police Station'],
  Kurunegala: ['Kurunegala Police Station', 'Kuliyapitiya Police Station'],
  Puttalam: ['Puttalam Police Station', 'Chilaw Police Station'],
  Anuradhapura: ['Anuradhapura Police Station', 'Kekirawa Police Station'],
  Polonnaruwa: ['Polonnaruwa Police Station', 'Medirigiriya Police Station'],
  Badulla: ['Badulla Police Station', 'Bandarawela Police Station'],
  Monaragala: ['Monaragala Police Station', 'Wellawaya Police Station'],
  Kegalle: ['Kegalle Police Station', 'Mawanella Police Station'],
  Ratnapura: ['Ratnapura Police Station', 'Embilipitiya Police Station'],
};

// Approximate bounding boxes for each province [minLat, maxLat, minLon, maxLon]
const PROVINCE_BOUNDS = {
  WP:  [6.70, 7.20, 79.80, 80.20],
  CP:  [7.00, 7.50, 80.50, 81.00],
  SP:  [5.90, 6.30, 80.00, 81.00],
  NP:  [8.50, 9.80, 79.80, 80.70],
  EP:  [7.00, 8.60, 81.20, 81.90],
  NWP: [7.40, 8.20, 79.70, 80.30],
  NCP: [7.80, 8.80, 80.20, 81.00],
  UP:  [6.60, 7.20, 80.70, 81.40],
  SGP: [6.40, 7.00, 80.20, 80.80],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const pad = (n, len = 3) => String(n).padStart(len, '0');

function randomCoord(bounds) {
  const [minLat, maxLat, minLon, maxLon] = bounds;
  return {
    latitude: parseFloat(rand(minLat, maxLat).toFixed(6)),
    longitude: parseFloat(rand(minLon, maxLon).toFixed(6)),
  };
}

// Walk coordinates step by step to simulate movement
function walkCoord(lat, lon, bounds) {
  const [minLat, maxLat, minLon, maxLon] = bounds;
  const dLat = rand(-0.005, 0.005);
  const dLon = rand(-0.005, 0.005);
  return {
    latitude: Math.min(maxLat, Math.max(minLat, parseFloat((lat + dLat).toFixed(6)))),
    longitude: Math.min(maxLon, Math.max(minLon, parseFloat((lon + dLon).toFixed(6)))),
  };
}

// ── Main seed function ───────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Clearing existing data...');

  await Promise.all([
    Province.deleteMany({}),
    District.deleteMany({}),
    PoliceStation.deleteMany({}),
    User.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    LocationPing.deleteMany({}),
  ]);

  // ── Provinces ──
  console.log('Seeding provinces...');
  const provinces = await Province.insertMany(PROVINCES);
  const provinceMap = {};
  provinces.forEach((p) => { provinceMap[p.code] = p; });

  // ── Districts ──
  console.log('Seeding districts...');
  const districtDocs = [];
  for (const [code, names] of Object.entries(DISTRICTS_BY_PROVINCE)) {
    for (const name of names) {
      districtDocs.push({ name, province: provinceMap[code]._id });
    }
  }
  const districts = await District.insertMany(districtDocs);
  const districtMap = {};
  districts.forEach((d) => { districtMap[d.name] = d; });

  // ── Police Stations ──
  console.log('Seeding police stations...');
  const stationDocs = [];
  for (const [districtName, stationNames] of Object.entries(STATIONS_BY_DISTRICT)) {
    const district = districtMap[districtName];
    if (!district) continue;
    for (const name of stationNames) {
      stationDocs.push({
        name,
        district: district._id,
        province: district.province,
        contact: `+94 ${randInt(10, 99)} ${randInt(1000000, 9999999)}`,
        address: `${name}, ${districtName}, Sri Lanka`,
      });
    }
  }
  const stations = await PoliceStation.insertMany(stationDocs);

  // ── Admin & Officer Users ──
  console.log('Seeding users...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const officerPassword = await bcrypt.hash('officer123', 12);

  await User.create({
    username: 'admin',
    email: 'admin@police.lk',
    password: adminPassword,
    role: 'admin',
    isActive: true,
  });

  const officerUsers = [];
  for (let i = 0; i < 5; i++) {
    const station = stations[i % stations.length];
    officerUsers.push({
      username: `officer_${pad(i + 1)}`,
      email: `officer${i + 1}@police.lk`,
      password: officerPassword,
      role: 'officer',
      policeStation: station._id,
      isActive: true,
    });
  }
  await User.insertMany(officerUsers);

  // ── Drivers ──
  console.log('Seeding 220 drivers...');
  const sinhalaFirstNames = ['Kamal', 'Nimal', 'Sunil', 'Priya', 'Chathura', 'Lasantha', 'Ruwan', 'Damith', 'Saman', 'Gayan', 'Upul', 'Chaminda', 'Tharaka', 'Mahesh', 'Dilan', 'Isuru', 'Janaka', 'Kasun', 'Lahiru', 'Malith'];
  const sinhalaLastNames = ['Perera', 'Silva', 'Fernando', 'Jayawardena', 'Wickramasinghe', 'Gunawardena', 'Dissanayake', 'Bandara', 'Rajapaksa', 'Senanayake', 'Mendis', 'Dias', 'Gunasekara', 'Liyanage', 'Rathnayake'];

  const driverDocs = [];
  for (let i = 0; i < 220; i++) {
    const provinceCode = pick(Object.keys(DISTRICTS_BY_PROVINCE));
    const province = provinceMap[provinceCode];
    const districtNames = DISTRICTS_BY_PROVINCE[provinceCode];
    const districtName = pick(districtNames);
    const district = districtMap[districtName];
    const firstName = pick(sinhalaFirstNames);
    const lastName = pick(sinhalaLastNames);
    const year = randInt(60, 99);
    const nicSuffix = randInt(1000000, 9999999);
    driverDocs.push({
      fullName: `${firstName} ${lastName}`,
      nicNumber: `${year}${nicSuffix}V`,
      licenseNumber: `B${randInt(100000, 999999)}`,
      contactPhone: `+94 7${randInt(0, 7)} ${randInt(1000000, 9999999)}`,
      address: `No. ${randInt(1, 200)}, ${districtName}, Sri Lanka`,
      province: province._id,
      district: district._id,
      isActive: Math.random() > 0.05,
    });
  }
  const drivers = await Driver.insertMany(driverDocs);

  // ── Vehicles ──
  console.log('Seeding 220 vehicles...');
  const vehicleDocs = [];
  const vehicleProvinceMap = {};

  for (let i = 0; i < 220; i++) {
    const provinceCode = pick(Object.keys(DISTRICTS_BY_PROVINCE));
    const province = provinceMap[provinceCode];
    const districtNames = DISTRICTS_BY_PROVINCE[provinceCode];
    const districtName = pick(districtNames);
    const district = districtMap[districtName];
    const lastName = pick(sinhalaLastNames);
    const firstName = pick(sinhalaFirstNames);
    const driver = drivers[i];
    const statusRoll = Math.random();
    const status = statusRoll < 0.85 ? 'active' : statusRoll < 0.93 ? 'suspended' : 'flagged';
    const regNum = `${provinceCode}-TK-${pad(i + 1)}`;

    vehicleDocs.push({
      registrationNumber: regNum,
      ownerName: `${firstName} ${lastName}`,
      ownerContact: `+94 7${randInt(0, 7)} ${randInt(1000000, 9999999)}`,
      ownerNIC: `${randInt(60, 99)}${randInt(1000000, 9999999)}V`,
      driver: driver._id,
      province: province._id,
      district: district._id,
      status,
    });

    vehicleProvinceMap[i] = { provinceCode, bounds: PROVINCE_BOUNDS[provinceCode] };
  }
  const vehicles = await Vehicle.insertMany(vehicleDocs);

  // Create device user accounts for the first 20 active vehicles
  console.log('Creating device user accounts for 20 vehicles...');
  const devicePassword = await bcrypt.hash('device123', 12);
  const deviceUsers = [];
  let deviceCount = 0;
  for (const vehicle of vehicles) {
    if (vehicle.status !== 'active' || deviceCount >= 20) continue;
    const deviceUser = await User.create({
      username: `device_${vehicle.registrationNumber.replace(/[^A-Z0-9]/g, '_')}`,
      email: `device_${vehicle.registrationNumber.replace(/[^A-Z0-9]/gi, '_').toLowerCase()}@gps.police.lk`,
      password: devicePassword,
      role: 'device',
      vehicle: vehicle._id,
      isActive: true,
    });
    await Vehicle.findByIdAndUpdate(vehicle._id, { deviceUser: deviceUser._id });
    deviceUsers.push(deviceUser);
    deviceCount++;
  }

  // ── Location Pings — 7 days of history for all active vehicles ──
  console.log('Seeding 7 days of location pings (this may take a moment)...');

  const NOW = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const PING_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

  const pingBatch = [];
  let pingTotal = 0;

  for (let vi = 0; vi < vehicles.length; vi++) {
    const vehicle = vehicles[vi];
    if (vehicle.status === 'suspended') continue;

    const bounds = vehicleProvinceMap[vi].bounds;
    let { latitude, longitude } = randomCoord(bounds);

    // Walk forward through 7 days, ping every 5 minutes
    for (
      let t = NOW - SEVEN_DAYS_MS;
      t <= NOW;
      t += PING_INTERVAL_MS
    ) {
      // 10% chance vehicle is "parked" (no ping for this slot)
      if (Math.random() < 0.1) continue;

      const walked = walkCoord(latitude, longitude, bounds);
      latitude = walked.latitude;
      longitude = walked.longitude;

      pingBatch.push({
        vehicle: vehicle._id,
        latitude,
        longitude,
        speed: parseFloat(rand(0, 60).toFixed(1)),
        heading: parseFloat(rand(0, 360).toFixed(1)),
        timestamp: new Date(t),
        receivedAt: new Date(t + randInt(500, 3000)),
      });

      pingTotal++;

      // Insert in chunks of 5000 to avoid memory issues
      if (pingBatch.length >= 5000) {
        await LocationPing.insertMany(pingBatch, { ordered: false });
        process.stdout.write(`\r  Inserted ${pingTotal} pings...`);
        pingBatch.length = 0;
      }
    }
  }

  if (pingBatch.length > 0) {
    await LocationPing.insertMany(pingBatch, { ordered: false });
  }

  console.log(`\n\nSeed complete!`);
  console.log(`  Provinces:      ${provinces.length}`);
  console.log(`  Districts:      ${districts.length}`);
  console.log(`  Stations:       ${stations.length}`);
  console.log(`  Users:          1 admin + 5 officers + ${deviceCount} devices`);
  console.log(`  Drivers:        ${drivers.length}`);
  console.log(`  Vehicles:       ${vehicles.length}`);
  console.log(`  Location pings: ~${pingTotal}`);
  console.log(`\nTest credentials:`);
  console.log(`  Admin    — email: admin@police.lk       password: admin123`);
  console.log(`  Officer  — email: officer1@police.lk    password: officer123`);
  console.log(`  Device   — email: ${deviceUsers[0] ? deviceUsers[0].email : 'see DB'}  password: device123`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
