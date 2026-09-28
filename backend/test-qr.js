import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000/api/v1';

async function login(email) {
  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email,
    password: 'devpassword123'
  });
  return res.data.data.accessToken;
}

async function getMyQr(token) {
  const res = await axios.get(`${BASE_URL}/members/me/qr`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data.qrValue;
}

async function scan(officerToken, qrValue, eventId) {
  try {
    const res = await axios.post(`${BASE_URL}/scan`, { rawQrValue: qrValue, eventId }, {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    return res.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

async function runTests() {
  try {
    console.log('0. Creating test event...');
    const event = await prisma.uswagEvent.create({
      data: {
        title: 'Test Event',
        description: 'Testing QR Scans',
        pillar: 'YOUTH_VOICE',
        scope: 'IN_CAMPUS',
        location: 'Main Hall',
        startsAt: new Date(),
      }
    });
    const eventId = event.id;

    console.log('1. Logging in users...');
    const officerToken = await login('miguel.castillo@nwssu.edu.ph');
    const activeMemberToken = await login('andrea.reyes@nwssu.edu.ph');
    const expiredMemberToken = await login('maricel.fajardo@nwssu.edu.ph');

    console.log('2. Fetching QR codes...');
    const activeQr = await getMyQr(activeMemberToken);
    const expiredQr = await getMyQr(expiredMemberToken);

    console.log('\n--- TEST 1: Valid Scan (Active Member) ---');
    const res1 = await scan(officerToken, activeQr, eventId);
    console.log(res1);

    console.log('\n--- TEST 2: Expired Scan (Expired Member) ---');
    const res2 = await scan(officerToken, expiredQr, eventId);
    console.log(res2);

    console.log('\n--- TEST 3: Invalid Signature Scan ---');
    let invalidQr = activeQr;
    if (invalidQr.includes('.')) {
       const parts = invalidQr.split('.');
       parts[parts.length - 1] = 'invalid' + parts[parts.length - 1];
       invalidQr = parts.join('.');
    } else {
       invalidQr += 'invalid';
    }
    const res3 = await scan(officerToken, invalidQr, eventId);
    console.log(res3);

    console.log('\nDone.');
  } catch (err) {
    console.error('Error running tests:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
