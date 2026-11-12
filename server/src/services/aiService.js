const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

/**
 * Helper to call Anthropic Claude API via native HTTPS (zero external dependencies)
 */
const callClaude = (systemPrompt, userPrompt) => {
  return new Promise((resolve, reject) => {
    if (!ANTHROPIC_API_KEY) {
      return reject(new Error('NO_API_KEY'));
    }

    const payload = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error(parsed.error?.message || `Status ${res.statusCode}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TIMEOUT'));
    });

    req.write(payload);
    req.end();
  });
};

const parseSafeJSON = (str, fallback = []) => {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * 1. Personalized Event Recommendations
 * Scores events based on student interests, skills, preferred types, and availability.
 */
const getRecommendations = async (studentProfile, events, pastRegistrations = []) => {
  const registeredEventIds = new Set(pastRegistrations.map((r) => r.eventId));
  const interests = parseSafeJSON(studentProfile?.interests, []).map((s) => s.toLowerCase());
  const skills = parseSafeJSON(studentProfile?.skills, []).map((s) => s.toLowerCase());
  const preferredTypes = parseSafeJSON(studentProfile?.preferredTypes, []).map((s) => s.toLowerCase());

  // Rule-based scoring
  const scoredEvents = events
    .filter((e) => !registeredEventIds.has(e.id) && e.seatsLeft > 0)
    .map((event) => {
      let score = 50; // Base score
      const reasons = [];
      const text = `${event.title} ${event.description} ${event.category?.name || ''}`.toLowerCase();
      const catSlug = (event.category?.slug || '').toLowerCase();

      if (preferredTypes.includes(catSlug)) {
        score += 20;
        reasons.push(`Matches your preferred event category (${event.category?.name})`);
      }

      const matchedInterests = interests.filter((i) => text.includes(i));
      if (matchedInterests.length > 0) {
        score += matchedInterests.length * 12;
        reasons.push(`Aligns with your interests in ${matchedInterests.join(', ')}`);
      }

      const matchedSkills = skills.filter((s) => text.includes(s));
      if (matchedSkills.length > 0) {
        score += matchedSkills.length * 10;
        reasons.push(`Great opportunity to apply your ${matchedSkills.join(', ')} skills`);
      }

      if (event.price === 0) {
        score += 5;
        reasons.push('Free entry');
      }

      if (event.seatsLeft <= 10) {
        score += 5;
        reasons.push(`High demand (${event.seatsLeft} seats left)`);
      }

      const matchScore = Math.min(99, score);
      return {
        ...event,
        matchScore,
        matchReason: reasons.length > 0 ? reasons.join(' • ') : 'Popular campus event open to all students'
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  // Attempt Claude enhancement if API key is configured
  if (ANTHROPIC_API_KEY && scoredEvents.length > 0) {
    try {
      const prompt = `Student Profile: Interests=${interests.join(', ')}, Skills=${skills.join(', ')}, Branch=${studentProfile?.branch || 'General'}.
Top Candidate Events: ${scoredEvents.map((e) => `${e.id}: ${e.title} (${e.category?.name})`).join('; ')}.
Provide a short 1-sentence personalized recommendation summary for this student.`;
      const aiSummary = await callClaude('You are an academic & campus event advisor.', prompt);
      return { recommendations: scoredEvents, aiSummary, source: 'claude' };
    } catch {
      // Fallback silently to rule-based
    }
  }

  return {
    recommendations: scoredEvents,
    aiSummary: interests.length > 0
      ? `Tailored for your interest in ${interests.slice(0, 3).join(', ')} and ${skills.slice(0, 2).join(', ')}.`
      : 'Top trending campus events curated for you.',
    source: 'rule-based-fallback'
  };
};

/**
 * 2. Compare Events ("Which event is better for me?")
 */
const compareEvents = async (eventA, eventB, studentProfile) => {
  const interests = parseSafeJSON(studentProfile?.interests, []).map((s) => s.toLowerCase());
  const skills = parseSafeJSON(studentProfile?.skills, []).map((s) => s.toLowerCase());

  const scoreEvent = (ev) => {
    let pts = 0;
    const text = `${ev.title} ${ev.description} ${ev.category?.name || ''} ${ev.prize || ''}`.toLowerCase();
    interests.forEach((i) => { if (text.includes(i)) pts += 15; });
    skills.forEach((s) => { if (text.includes(s)) pts += 12; });
    if (ev.price === 0) pts += 8;
    if (ev.prize && ev.prize.includes('$')) pts += 10;
    if (ev.seatsLeft > 0) pts += 5;
    return pts;
  };

  const scoreA = scoreEvent(eventA);
  const scoreB = scoreEvent(eventB);
  const hasScheduleConflict =
    Math.abs(new Date(eventA.schedule).getTime() - new Date(eventB.schedule).getTime()) < 3 * 3600 * 1000;

  const winner = scoreA >= scoreB ? eventA : eventB;
  const runnerUp = scoreA >= scoreB ? eventB : eventA;

  const fallbackResult = {
    eventA: {
      id: eventA.id,
      title: eventA.title,
      category: eventA.category?.name,
      price: eventA.price,
      schedule: eventA.schedule,
      venue: eventA.venue,
      isTeamEvent: eventA.isTeamEvent,
      prize: eventA.prize,
      seatsLeft: eventA.seatsLeft,
      fitScore: Math.min(98, 60 + scoreA)
    },
    eventB: {
      id: eventB.id,
      title: eventB.title,
      category: eventB.category?.name,
      price: eventB.price,
      schedule: eventB.schedule,
      venue: eventB.venue,
      isTeamEvent: eventB.isTeamEvent,
      prize: eventB.prize,
      seatsLeft: eventB.seatsLeft,
      fitScore: Math.min(98, 60 + scoreB)
    },
    hasScheduleConflict,
    recommendedEventId: winner.id,
    recommendedTitle: winner.title,
    verdict: `${winner.title} is a stronger match (${Math.min(98, 60 + Math.max(scoreA, scoreB))}% fit) based on your profile, pricing ($${winner.price}), and rewards (${winner.prize || 'Certificate'}). ${
      hasScheduleConflict
        ? 'Note: Both events overlap in schedule, so you should pick one.'
        : `There is no schedule conflict, so you could also attend ${runnerUp.title}!`
    }`,
    dimensions: [
      { label: 'Category', eventA: eventA.category?.name || 'General', eventB: eventB.category?.name || 'General' },
      { label: 'Entry Fee', eventA: eventA.price === 0 ? 'Free' : `$${eventA.price}`, eventB: eventB.price === 0 ? 'Free' : `$${eventB.price}` },
      { label: 'Format', eventA: eventA.isTeamEvent ? `Team (${eventA.minTeamSize}-${eventA.maxTeamSize})` : 'Solo', eventB: eventB.isTeamEvent ? `Team (${eventB.minTeamSize}-${eventB.maxTeamSize})` : 'Solo' },
      { label: 'Mode', eventA: eventA.isOnline ? 'Online' : `In-person (${eventA.venue})`, eventB: eventB.isOnline ? 'Online' : `In-person (${eventB.venue})` },
      { label: 'Rewards / Prize', eventA: eventA.prize || 'Participation Certificate', eventB: eventB.prize || 'Participation Certificate' },
      { label: 'Availability', eventA: `${eventA.seatsLeft}/${eventA.maxSeats} seats left`, eventB: `${eventB.seatsLeft}/${eventB.maxSeats} seats left` }
    ],
    source: 'rule-based-fallback'
  };

  if (ANTHROPIC_API_KEY) {
    try {
      const prompt = `Compare these two college events for a student with interests [${interests.join(', ')}] and skills [${skills.join(', ')}]:
1) ${eventA.title} (${eventA.category?.name}, Price: $${eventA.price}, Prize: ${eventA.prize}, Mode: ${eventA.isOnline ? 'Online' : eventA.venue})
2) ${eventB.title} (${eventB.category?.name}, Price: $${eventB.price}, Prize: ${eventB.prize}, Mode: ${eventB.isOnline ? 'Online' : eventB.venue})
Give a concise 2-3 sentence verdict on which event is better for this student and why.`;
      const aiVerdict = await callClaude('You are a helpful college event advisor.', prompt);
      fallbackResult.verdict = aiVerdict;
      fallbackResult.source = 'claude';
    } catch {
      // Keep fallback verdict
    }
  }

  return fallbackResult;
};

/**
 * 3. Ask AI Assistant Chat
 */
const askAssistant = async (message, contextEvents = [], user = null) => {
  const q = (message || '').toLowerCase();

  if (ANTHROPIC_API_KEY) {
    try {
      const eventSummary = contextEvents
        .slice(0, 12)
        .map((e) => `- ${e.title} (${e.category?.name}, ${new Date(e.schedule).toLocaleDateString()}, Fee: $${e.price}, Seats left: ${e.seatsLeft}, Slug: /events/${e.slug})`)
        .join('\n');
      const system = `You are the EventSphere AI Campus Assistant. Help students find events, understand rules, registration, certificates, and team formation. Available events:\n${eventSummary}`;
      const reply = await callClaude(system, message);
      return { reply, suggestedEvents: contextEvents.slice(0, 3), source: 'claude' };
    } catch {
      // Fallback below
    }
  }

  // Rule-based intelligent matching
  let matched = contextEvents.filter((e) => {
    const text = `${e.title} ${e.description} ${e.category?.name || ''} ${e.venue}`.toLowerCase();
    return q.split(/\s+/).some((word) => word.length > 3 && text.includes(word));
  });

  if (q.includes('free')) {
    matched = contextEvents.filter((e) => e.price === 0);
  } else if (q.includes('hackathon') || q.includes('coding') || q.includes('tech')) {
    matched = contextEvents.filter((e) => ['hackathon', 'coding-contest', 'workshop'].includes(e.category?.slug));
  } else if (q.includes('online') || q.includes('remote')) {
    matched = contextEvents.filter((e) => e.isOnline);
  } else if (q.includes('team')) {
    matched = contextEvents.filter((e) => e.isTeamEvent);
  }

  const topMatches = (matched.length > 0 ? matched : contextEvents).slice(0, 3);
  const names = topMatches.map((e) => `**${e.title}** (${e.price === 0 ? 'Free' : '$' + e.price}, ${e.seatsLeft} seats left)`).join(', ');

  let reply = `Here are the best matching events on EventSphere right now: ${names}. You can click on any event to view rules, find teammates in the community tab, or claim your QR ticket!`;
  if (q.includes('certificate')) {
    reply = `Certificates are automatically awarded to participants and winners once an organizer marks an event as completed. You can download them anytime from your **Student Portfolio**! Currently popular events offering certificates include: ${names}.`;
  } else if (q.includes('ticket') || q.includes('qr') || q.includes('seat')) {
    reply = `When you register for an event, a unique QR ticket is generated immediately under **My Tickets**. For seated venues, you can also pick or auto-allocate your seat with friends!`;
  }

  return {
    reply,
    suggestedEvents: topMatches.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      category: e.category?.name,
      price: e.price,
      seatsLeft: e.seatsLeft
    })),
    source: 'rule-based-fallback'
  };
};

/**
 * 4. Organizer Demand Prediction & Feedback Intelligence
 */
const analyzeOrganizerInsights = async (event, feedbacks = []) => {
  const booked = event.maxSeats - event.seatsLeft;
  const fillRate = event.maxSeats > 0 ? Math.round((booked / event.maxSeats) * 100) : 0;
  const daysUntil = Math.max(1, Math.ceil((new Date(event.schedule).getTime() - Date.now()) / 86400000));
  const projectedFill = Math.min(100, Math.round(fillRate + (100 - fillRate) * (0.45 / Math.sqrt(daysUntil))));

  const demandLevel = projectedFill >= 85 ? 'HIGH' : projectedFill >= 50 ? 'MODERATE' : 'LOW';

  // Sentiment & tag aggregation from feedback
  const ratings = feedbacks.map((f) => f.rating);
  const avgRating = ratings.length > 0 ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null;
  const tagCounts = {};
  feedbacks.forEach((f) => {
    parseSafeJSON(f.tags, []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sentiment = !avgRating ? 'NEUTRAL' : avgRating >= 4.2 ? 'POSITIVE' : avgRating >= 3.0 ? 'MIXED' : 'NEEDS_IMPROVEMENT';

  return {
    demandPrediction: {
      currentBooked: booked,
      maxSeats: event.maxSeats,
      currentFillRate: fillRate,
      projectedFillRate: projectedFill,
      demandLevel,
      daysUntilEvent: daysUntil,
      recommendation:
        demandLevel === 'HIGH'
          ? 'Event is trending toward full capacity. Consider upgrading to a larger auditorium or enabling waitlist.'
          : demandLevel === 'MODERATE'
          ? 'Steady registration pace. Post an announcement in the Community feed to boost team signups.'
          : 'Registrations are below target. Highlight prizes and share early-bird reminders with student clubs.'
    },
    feedbackIntelligence: {
      totalResponses: feedbacks.length,
      averageRating: avgRating,
      sentiment,
      topTags: Object.entries(tagCounts).map(([tag, count]) => ({ tag, count })),
      summary:
        feedbacks.length > 0
          ? `Received ${feedbacks.length} feedback submissions with an average rating of ${avgRating}/5 (${sentiment}).`
          : 'No feedback submitted yet. Feedback insights will populate automatically as attendees rate the event.'
    }
  };
};

module.exports = {
  getRecommendations,
  compareEvents,
  askAssistant,
  analyzeOrganizerInsights
};
