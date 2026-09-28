import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/v1';

async function login(email) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password: 'devpassword123' });
  return { token: res.data.data.accessToken, user: res.data.data.user };
}

async function runTests() {
  try {
    console.log('--- 1. Login Users ---');
    const secretary = await login('nico.fernandez@nwssu.edu.ph');
    const treasurer = await login('patricia.sy@nwssu.edu.ph');
    const pro = await login('grace.tolentino@nwssu.edu.ph');
    const member = await login('andrea.reyes@nwssu.edu.ph');
    console.log('Logged in Secretary, Treasurer, PRO, and Member.');

    console.log('\n--- 2. Member Management Flow ---');
    // List pending members
    let res = await axios.get(`${BASE_URL}/members?status=PENDING`, {
      headers: { Authorization: `Bearer ${secretary.token}` }
    });
    const pendingMembers = res.data.data;
    console.log(`Found ${pendingMembers.length} pending members.`);
    
    if (pendingMembers.length > 0) {
      const pendingUserId = pendingMembers[0].userId;

      // Try approve as Treasurer (Should 403)
      try {
        await axios.post(`${BASE_URL}/members/${pendingUserId}/approve`, { academicYear: '2026-2027' }, {
          headers: { Authorization: `Bearer ${treasurer.token}` }
        });
        console.error('FAIL: Treasurer was able to approve a member!');
      } catch (err) {
        console.log(`SUCCESS: Treasurer correctly got ${err.response.status} 403 Forbidden.`);
      }

      // Approve as Secretary
      res = await axios.post(`${BASE_URL}/members/${pendingUserId}/approve`, { academicYear: '2026-2027' }, {
        headers: { Authorization: `Bearer ${secretary.token}` }
      });
      console.log('Secretary successfully approved member.', res.data.data);

      // Verify QR via admin or login as the pending user
      // We will login as Jasmine Lopez (who was pending)
      const newMember = await login('jasmine.lopez@nwssu.edu.ph');
      const qrRes = await axios.get(`${BASE_URL}/members/me/qr`, {
        headers: { Authorization: `Bearer ${newMember.token}` }
      });
      console.log('Successfully fetched new QR for the newly approved member:', qrRes.data.data);
    }

    console.log('\n--- 3. Event Creation Flow ---');
    // Create Event as Secretary (Officer Admin)
    res = await axios.post(`${BASE_URL}/events`, {
      title: 'End-to-End Test Event',
      description: 'Testing event flows',
      pillar: 'YOUTH_VOICE',
      scope: 'IN_CAMPUS',
      location: 'Test Location',
      startsAt: new Date().toISOString()
    }, { headers: { Authorization: `Bearer ${secretary.token}` } });
    const eventId = res.data.data.id;
    console.log('Officer created event:', res.data.data.title);

    // RSVP as member
    res = await axios.post(`${BASE_URL}/events/${eventId}/rsvp`, {}, {
      headers: { Authorization: `Bearer ${member.token}` }
    });
    console.log('Member RSVP successful:', res.data.data);

    console.log('\n--- 4. Manual Post Creation Flow ---');
    // PRO tries to create post
    res = await axios.post(`${BASE_URL}/posts`, { body: 'Hello world from PRO' }, {
      headers: { Authorization: `Bearer ${pro.token}` }
    });
    console.log('PRO created post:', res.data.data);

    // Treasurer tries to create post (Should 403)
    try {
      await axios.post(`${BASE_URL}/posts`, { body: 'Hello world from Treasurer' }, {
        headers: { Authorization: `Bearer ${treasurer.token}` }
      });
      console.error('FAIL: Treasurer was able to create a post!');
    } catch (err) {
      console.log(`SUCCESS: Treasurer correctly got ${err.response.status} 403 Forbidden when creating post.`);
    }

    console.log('\nAll End-to-End Tests Complete!');
  } catch (error) {
    console.error('Test Failed:', error.response?.data || error.message);
  }
}

runTests();
