const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data
  await prisma.attendanceLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.venueLayout.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned up old database records.');

  // Create Categories
  const categoriesData = [
    { name: 'Fest', slug: 'fest', description: 'Annual college cultural and tech fests', icon: 'Sparkles' },
    { name: 'Hackathon', slug: 'hackathon', description: 'Coding marathons & innovation challenges', icon: 'Code' },
    { name: 'Gaming Competition', slug: 'gaming-competition', description: 'Esports, LAN parties & gaming tournaments', icon: 'Gamepad2' },
    { name: 'Workshop', slug: 'workshop', description: 'Hands-on technical & creative skill sessions', icon: 'Wrench' },
    { name: 'Seminar', slug: 'seminar', description: 'Expert talks, keynotes & industry insights', icon: 'Presentation' },
    { name: 'Cultural', slug: 'cultural', description: 'Dance, music, drama and art performances', icon: 'Music' },
    { name: 'Sports', slug: 'sports', description: 'Inter-college tournaments and athletic meets', icon: 'Trophy' },
    { name: 'Coding Contest', slug: 'coding-contest', description: 'Competitive programming & algorithm challenges', icon: 'Terminal' },
    { name: 'Club Activity', slug: 'club-activity', description: 'Meetups and interactive sessions by student clubs', icon: 'Users' }
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created.id;
  }
  console.log('📁 Created categories.');

  // Create Users & Profiles (10 users: 3 organizers, 1 admin, 6 students)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eventsphere.edu',
      passwordHash: hashedPassword,
      name: 'Dr. Sarah Administrator',
      role: 'ADMIN'
    }
  });

  // Organizers
  const organizer1 = await prisma.user.create({
    data: {
      email: 'organizer.tech@eventsphere.edu',
      passwordHash: hashedPassword,
      name: 'Prof. Alan Turing Club',
      role: 'ORGANIZER'
    }
  });

  const organizer2 = await prisma.user.create({
    data: {
      email: 'organizer.cultural@eventsphere.edu',
      passwordHash: hashedPassword,
      name: 'Cultural Council Head',
      role: 'ORGANIZER'
    }
  });

  const organizer3 = await prisma.user.create({
    data: {
      email: 'organizer.sports@eventsphere.edu',
      passwordHash: hashedPassword,
      name: 'Sports Directorate',
      role: 'ORGANIZER'
    }
  });

  // Students (6 students)
  const studentsData = [
    { email: 'student1@eventsphere.edu', name: 'Alex Chen', branch: 'Computer Science', year: 3, interests: ['Coding', 'AI', 'Hackathon'], skills: ['Python', 'React', 'Node.js'] },
    { email: 'student2@eventsphere.edu', name: 'Priya Sharma', branch: 'Information Technology', year: 4, interests: ['Web Dev', 'Design', 'Fest'], skills: ['UI/UX', 'Figma', 'HTML/CSS'] },
    { email: 'student3@eventsphere.edu', name: 'Marcus Johnson', branch: 'Electronics', year: 2, interests: ['Gaming Competition', 'Robotics', 'Hardware'], skills: ['C++', 'Arduino', 'Python'] },
    { email: 'student4@eventsphere.edu', name: 'Emily Davis', branch: 'Mechanical', year: 3, interests: ['Cultural', 'Music', 'Drama'], skills: ['Guitar', 'Vocal', 'Event Management'] },
    { email: 'student5@eventsphere.edu', name: 'Liam Wilson', branch: 'Computer Science', year: 1, interests: ['Coding Contest', 'Algorithms', 'AI'], skills: ['C++', 'Java', 'Data Structures'] },
    { email: 'student6@eventsphere.edu', name: 'Sophia Martinez', branch: 'Biotech', year: 2, interests: ['Sports', 'Seminar', 'Club Activity'], skills: ['Badminton', 'Public Speaking', 'Research'] }
  ];

  const studentUsers = [];
  for (const s of studentsData) {
    const u = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: hashedPassword,
        name: s.name,
        role: 'STUDENT',
        studentProfile: {
          create: {
            college: 'State University of Technology',
            branch: s.branch,
            year: s.year,
            interests: JSON.stringify(s.interests),
            skills: JSON.stringify(s.skills),
            preferredTypes: JSON.stringify(['hackathon', 'workshop', 'coding-contest', 'fest'])
          }
        }
      },
      include: { studentProfile: true }
    });
    studentUsers.push(u);
  }
  console.log('👥 Created 10 users (Admin, 3 Organizers, 6 Students).');

  // Create Venue Layouts
  const venueLayout1 = await prisma.venueLayout.create({
    data: {
      name: 'Main Auditorium (50 seats)',
      rows: 5,
      columns: 10,
      layoutData: JSON.stringify({ accessibleRows: [0], vipRows: [1] })
    }
  });

  const venueLayout2 = await prisma.venueLayout.create({
    data: {
      name: 'Tech Lab 3B (30 seats)',
      rows: 3,
      columns: 10,
      layoutData: JSON.stringify({ accessibleRows: [0] })
    }
  });

  // Create 25+ Sample Events
  const sampleEvents = [
    {
      title: 'HackHorizon 2026: 36-Hour National Hackathon',
      slug: 'hackhorizon-2026',
      description: 'The biggest annual hackathon of the state. Build innovative AI, Web3, or GreenTech solutions for prizes worth $10,000!',
      schedule: new Date(Date.now() + 86400000 * 3), // 3 days later
      venue: 'Main Auditorium',
      isOnline: false,
      isTeamEvent: true,
      minTeamSize: 2,
      maxTeamSize: 4,
      maxSeats: 50,
      seatsLeft: 42,
      price: 0.0,
      rules: 'All code must be written during the hackathon. Bring your own laptops and chargers.',
      prize: '$10,000 + Internship Offers',
      posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      categoryId: categories['hackathon'],
      venueLayoutId: venueLayout1.id
    },
    {
      title: 'AI & Large Language Models Masterclass',
      slug: 'ai-llm-masterclass',
      description: 'Learn how to build production applications with Claude, GPT-4, and Vector databases from industry experts.',
      schedule: new Date(Date.now() + 86400000 * 5),
      venue: 'Tech Lab 3B',
      isOnline: false,
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      maxSeats: 30,
      seatsLeft: 12,
      price: 15.0,
      rules: 'Basic Python knowledge recommended.',
      prize: 'Certificate of Excellence & Free Cloud Credits',
      posterUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      categoryId: categories['workshop'],
      venueLayoutId: venueLayout2.id
    },
    {
      title: 'Valorant Inter-College Esports Championship',
      slug: 'valorant-esports-championship',
      description: 'Gather your squad of 5 and battle for supremacy in the ultimate tactical shooter tournament.',
      schedule: new Date(Date.now() + 86400000 * 7),
      venue: 'Student Activity Center & Online',
      isOnline: true,
      isTeamEvent: true,
      minTeamSize: 5,
      maxTeamSize: 5,
      maxSeats: 40,
      seatsLeft: 10,
      price: 10.0,
      rules: 'Standard tournament rules. Anti-cheat required.',
      prize: '$2,500 Cash + Gaming Gear',
      posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer3.id,
      categoryId: categories['gaming-competition'],
      venueLayoutId: venueLayout1.id
    },
    {
      title: 'Apex Annual Cultural Fest 2026',
      slug: 'apex-cultural-fest-2026',
      description: 'Three days of electrifying music concerts, battle of the bands, classical & western dance, and fashion show.',
      schedule: new Date(Date.now() + 86400000 * 12),
      venue: 'University Open Air Theatre',
      isOnline: false,
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      maxSeats: 50,
      seatsLeft: 5,
      price: 5.0,
      rules: 'Valid college ID card mandatory at entry gates.',
      prize: 'Trophies and Celebrity Judge Recognition',
      posterUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer2.id,
      categoryId: categories['fest'],
      venueLayoutId: venueLayout1.id
    },
    {
      title: 'Algorithmic Speed Coding Sprint',
      slug: 'algo-speed-coding-sprint',
      description: 'Solve 5 challenging algorithmic puzzles in 2 hours on Codeforces/LeetCode platform.',
      schedule: new Date(Date.now() + 86400000 * 4),
      venue: 'Computer Center Lab 1',
      isOnline: false,
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      maxSeats: 30,
      seatsLeft: 18,
      price: 0.0,
      rules: 'No external AI tools allowed during contest.',
      prize: '$1,000 + Tech Books',
      posterUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      categoryId: categories['coding-contest'],
      venueLayoutId: venueLayout2.id
    },
    {
      title: 'RoboWars Combat Arena 2026',
      slug: 'robowars-combat-arena',
      description: 'Build remote-controlled combat robots and destroy opponents in the armored arena!',
      schedule: new Date(Date.now() + 86400000 * 9),
      venue: 'Mechanical Workshop Yard',
      isOnline: false,
      isTeamEvent: true,
      minTeamSize: 2,
      maxTeamSize: 4,
      maxSeats: 20,
      seatsLeft: 8,
      price: 20.0,
      rules: 'Weight limit 15kg. Safety kill-switch mandatory.',
      prize: '$3,000 Grand Prize',
      posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      categoryId: categories['club-activity'],
      venueLayoutId: venueLayout1.id
    },
    {
      title: 'Classical & Contemporary Dance Night',
      slug: 'dance-night-2026',
      description: 'Showcase your rhythm and graceful moves in solo or group dance categories.',
      schedule: new Date(Date.now() + 86400000 * 6),
      venue: 'Indoor Auditorium',
      isOnline: false,
      isTeamEvent: true,
      minTeamSize: 1,
      maxTeamSize: 10,
      maxSeats: 40,
      seatsLeft: 15,
      price: 0.0,
      rules: 'Track must be submitted 24 hours prior.',
      prize: 'Gold Medals and Trophy',
      posterUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer2.id,
      categoryId: categories['cultural'],
      venueLayoutId: venueLayout1.id
    },
    {
      title: 'Inter-College Cricket Premier League',
      slug: 'cricket-premier-league',
      description: 'T20 Knockout tournament at the university sports complex.',
      schedule: new Date(Date.now() + 86400000 * 15),
      venue: 'University Cricket Stadium',
      isOnline: false,
      isTeamEvent: true,
      minTeamSize: 11,
      maxTeamSize: 15,
      maxSeats: 16, // 16 teams
      seatsLeft: 4,
      price: 50.0,
      rules: 'White kit mandatory. Professional umpire decisions final.',
      prize: '$5,000 Rolling Trophy',
      posterUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer3.id,
      categoryId: categories['sports'],
      venueLayoutId: venueLayout1.id
    },
    {
      title: 'Cybersecurity Ethical Hacking Seminar',
      slug: 'cybersec-ethical-hacking-seminar',
      description: 'Keynote by top penetration testers on modern web vulnerabilities and bug bounties.',
      schedule: new Date(Date.now() + 86400000 * 2),
      venue: 'Lecture Hall 4',
      isOnline: true,
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 1,
      maxSeats: 50,
      seatsLeft: 22,
      price: 0.0,
      rules: 'Open to all engineering years.',
      prize: 'Swag kits for top active participants',
      posterUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer1.id,
      categoryId: categories['seminar'],
      venueLayoutId: venueLayout2.id
    },
    {
      title: 'UI/UX Design Sprint & Figma Jam',
      slug: 'ui-ux-design-sprint',
      description: 'Redesign a campus mobile app in 4 hours with live expert mentorship.',
      schedule: new Date(Date.now() + 86400000 * 8),
      venue: 'Design Studio 2',
      isOnline: false,
      isTeamEvent: false,
      minTeamSize: 1,
      maxTeamSize: 2,
      maxSeats: 30,
      seatsLeft: 14,
      price: 5.0,
      rules: 'Must bring laptop with Figma installed.',
      prize: '$800 + Pro Figma Licenses',
      posterUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: organizer2.id,
      categoryId: categories['workshop'],
      venueLayoutId: venueLayout2.id
    }
  ];

  // Add 15 more generated sample events to ensure 25+
  const extraCategories = Object.values(categories);
  const extraOrganizers = [organizer1.id, organizer2.id, organizer3.id];
  for (let i = 11; i <= 28; i++) {
    const catId = extraCategories[i % extraCategories.length];
    const orgId = extraOrganizers[i % extraOrganizers.length];
    sampleEvents.push({
      title: `Campus Tech & Cultural Event #${i}`,
      slug: `campus-event-${i}`,
      description: `An engaging university event designed for students to explore talents, collaborate, and win exciting prizes.`,
      schedule: new Date(Date.now() + 86400000 * (i + 2)),
      venue: i % 2 === 0 ? 'Main Auditorium' : 'Seminar Hall B',
      isOnline: i % 3 === 0,
      isTeamEvent: i % 2 === 0,
      minTeamSize: i % 2 === 0 ? 2 : 1,
      maxTeamSize: i % 2 === 0 ? 4 : 1,
      maxSeats: 40,
      seatsLeft: 25,
      price: (i % 3) * 10.0,
      rules: 'Standard college event guidelines apply.',
      prize: 'Medals & Certificates',
      posterUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      organizerId: orgId,
      categoryId: catId,
      venueLayoutId: venueLayout1.id
    });
  }

  const createdEvents = [];
  for (const evData of sampleEvents) {
    const ev = await prisma.event.create({ data: evData });
    createdEvents.push(ev);
  }
  console.log(`🎉 Created ${createdEvents.length} sample events.`);

  // Create Registrations & Tickets for student1 & student2
  for (let i = 0; i < 3; i++) {
    const event = createdEvents[i];
    const student = studentUsers[i];

    const reg = await prisma.registration.create({
      data: {
        eventId: event.id,
        userId: student.id,
        status: 'CONFIRMED',
        teamName: event.isTeamEvent ? `Team Alpha-${i}` : null,
        teamMembers: event.isTeamEvent ? JSON.stringify([student.name, 'Teammate 2']) : null
      }
    });

    // Create Ticket with unique QR code
    const ticketCode = `TICKET-${event.id.substring(0, 6)}-${student.id.substring(0, 6)}`;
    await prisma.ticket.create({
      data: {
        registrationId: reg.id,
        qrCode: ticketCode,
        isUsed: i === 0 // Mark first ticket as used for testing scanner
      }
    });
  }
  console.log('🎟️ Created sample registrations and QR tickets.');

  // Create Community Posts & Comments
  const firstEvent = createdEvents[0];
  const post = await prisma.communityPost.create({
    data: {
      eventId: firstEvent.id,
      userId: studentUsers[0].id,
      title: 'Looking for 2 more teammates with React & Node experience!',
      content: 'Hey everyone! Our team is building an AI Healthcare Assistant for HackHorizon. We need a frontend wizard and backend developer. Hit me up!',
      isAnnouncement: false,
      tags: JSON.stringify(['React', 'Node.js', 'AI', 'Teammate'])
    }
  });

  await prisma.comment.create({
    data: {
      postId: post.id,
      userId: studentUsers[1].id,
      content: 'Hey Alex! I am proficient in React and Tailwind. Would love to join your team!'
    }
  });
  console.log('💬 Created community posts and comments.');

  // Create Sample Feedback & Certificates
  await prisma.feedback.create({
    data: {
      eventId: createdEvents[1].id,
      userId: studentUsers[0].id,
      rating: 5,
      tags: JSON.stringify(['content', 'organization']),
      comment: 'Extremely insightful workshop on Claude and LLMs! The hands-on examples were super clear.'
    }
  });

  await prisma.certificate.create({
    data: {
      userId: studentUsers[0].id,
      eventId: createdEvents[1].id,
      resultType: 'WINNER',
      title: 'Certificate of Excellence - AI Masterclass Hackathon',
      certificateUrl: 'https://example.com/cert-1.pdf'
    }
  });
  console.log('🏆 Created sample feedback and certificates.');

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
