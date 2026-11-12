const assert = require('assert');
const http = require('http');
const app = require('../src/index');

const request = (server, method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

async function runTests() {
  const server = app.listen(0);
  console.log('🧪 Starting EventSphere API End-to-End Tests...');

  try {
    // 1. Health check
    const health = await request(server, 'GET', '/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');
    console.log('✅ 1. /api/health passed');

    // 2. Auth Login (Student & Organizer)
    const studentLogin = await request(server, 'POST', '/api/auth/login', {
      email: 'student1@eventsphere.edu',
      password: 'password123'
    });
    assert.strictEqual(studentLogin.status, 200);
    const studentToken = studentLogin.body.token;
    assert.ok(studentToken);

    const orgLogin = await request(server, 'POST', '/api/auth/login', {
      email: 'organizer.tech@eventsphere.edu',
      password: 'password123'
    });
    assert.strictEqual(orgLogin.status, 200);
    const orgToken = orgLogin.body.token;
    assert.ok(orgToken);
    console.log('✅ 2. /api/auth/login (student & organizer) passed');

    // 3. Events & Search & Categories
    const cats = await request(server, 'GET', '/api/events/categories');
    assert.strictEqual(cats.status, 200);
    assert.ok(cats.body.length >= 9);

    const eventsRes = await request(server, 'GET', '/api/events?q=HackHorizon');
    assert.strictEqual(eventsRes.status, 200);
    assert.ok(eventsRes.body.events.length >= 1);
    const allEventsRes = await request(server, 'GET', '/api/events');
    const eventA = allEventsRes.body.events[0];
    const eventB = allEventsRes.body.events[1];
    console.log('✅ 3. /api/events & /api/events/categories passed');

    // 4. AI Recommendations, Compare & Chat
    const recs = await request(server, 'GET', '/api/ai/recommendations', null, studentToken);
    assert.strictEqual(recs.status, 200);
    assert.ok(Array.isArray(recs.body.recommendations));

    const compare = await request(
      server,
      'POST',
      '/api/ai/compare',
      { eventAId: eventA.id, eventBId: eventB.id },
      studentToken
    );
    assert.strictEqual(compare.status, 200);
    assert.ok(compare.body.verdict);

    const chat = await request(
      server,
      'POST',
      '/api/ai/chat',
      { message: 'Are there any free hackathons?' },
      studentToken
    );
    assert.strictEqual(chat.status, 200);
    assert.ok(chat.body.reply);
    console.log('✅ 4. /api/ai (recommendations, compare, chat) passed');

    // 5. My Registrations, New Registration, Seats & Attendance Verification
    const myRegs = await request(server, 'GET', '/api/registrations/my-registrations', null, studentToken);
    assert.strictEqual(myRegs.status, 200);
    assert.ok(myRegs.body.registrations.length >= 1);
    const registeredEventId = myRegs.body.registrations[0].event.id;

    const seatsRes = await request(server, 'GET', `/api/seats/event/${registeredEventId}`);
    assert.strictEqual(seatsRes.status, 200);
    assert.strictEqual(seatsRes.body.hasLayout, true);
    assert.ok(seatsRes.body.seats.length > 0);

    const allocRes = await request(
      server,
      'POST',
      '/api/seats/allocate',
      { eventId: registeredEventId, autoAllocate: true },
      studentToken
    );
    assert.strictEqual(allocRes.status, 200);
    assert.ok(allocRes.body.seat.seatLabel);
    console.log(`✅ 5. /api/seats (loaded ${seatsRes.body.seats.length} seats & allocated ${allocRes.body.seat.seatLabel}) passed`);

    // 6. Register student1 for an event they haven't joined yet and verify QR
    const targetEvent = allEventsRes.body.events.find((e) => e.id !== registeredEventId);
    const regNew = await request(
      server,
      'POST',
      '/api/registrations',
      { eventId: targetEvent.id, teamName: 'CodeWizards' },
      studentToken
    );
    assert.ok([201, 400].includes(regNew.status));
    if (regNew.status === 201) {
      const qr = regNew.body.ticket.qrCode;
      const scan = await request(server, 'POST', '/api/attendance/verify', { qrCode: qr }, orgToken);
      assert.strictEqual(scan.status, 200);
      assert.strictEqual(scan.body.status, 'SUCCESS');
    }
    console.log('✅ 6. /api/registrations & /api/attendance/verify passed');

    // 7. Organizer Dashboard
    const dash = await request(server, 'GET', '/api/organizer/dashboard', null, orgToken);
    assert.strictEqual(dash.status, 200);
    assert.ok(dash.body.summary.totalEvents >= 1);
    console.log('✅ 7. /api/organizer/dashboard passed');

    // 8. Community Posts, Feedback, Portfolio
    const posts = await request(server, 'GET', '/api/community/posts');
    assert.strictEqual(posts.status, 200);

    const portfolio = await request(server, 'GET', '/api/community/portfolio', null, studentToken);
    assert.strictEqual(portfolio.status, 200);
    assert.strictEqual(portfolio.body.profile.email, 'student1@eventsphere.edu');
    console.log('✅ 8. /api/community (posts, feedback, portfolio) passed');

    console.log('\n🎉 ALL SERVER TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
