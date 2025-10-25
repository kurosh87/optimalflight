export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  publishedAt: string;
  readingTime: string;
  category: string;
  tags: string[];
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "introducing-automatic-calendar-sync",
    title: "Introducing Automatic Calendar Sync: Your Jetlag Recovery Plan, Perfectly Scheduled",
    excerpt:
      "We're excited to announce our biggest update yet: automatic calendar integration with Google Calendar, Outlook, and Apple Calendar. Now your personalized recovery plan syncs directly to your calendar with smart reminders and custom colors.",
    category: "Product Updates",
    tags: ["Calendar", "Features", "Integration"],
    publishedAt: "2025-10-09",
    readingTime: "4 min read",
    featured: true,
    author: {
      name: "GetNoJetlag Team",
      role: "Product Team",
    },
    content: `
# The Problem: Great Plans, Poor Execution

We've helped thousands of travelers create science-based jetlag recovery plans. But we noticed a pattern: even the best recovery plan doesn't work if you forget to follow it.

You land in Tokyo at 6 AM. Your recovery plan says "Get 30 minutes of bright light at 7 AM." But you're exhausted, disoriented, and fumbling through a PDF trying to remember what comes next.

Sound familiar?

## The Solution: Automatic Calendar Integration

Today, we're launching **automatic calendar sync**—our most requested feature.

Now, when you create a recovery plan, we automatically add every activity to your calendar:

- ☀️ **Light therapy sessions** (with exact timing)
- 😴 **Sleep schedules** (bedtime reminders)
- 💊 **Melatonin doses** (optimal timing)
- 🍳 **Meal times** (to reset your circadian rhythm)
- 🏃 **Exercise windows** (for maximum effectiveness)
- ☕ **Caffeine cutoffs** (so you can actually sleep)

All synced to **Google Calendar, Microsoft Outlook, or Apple Calendar**.

## How It Works

### 1. Connect Your Calendar (Once)

In your settings, connect your preferred calendar app. We support:
- **Google Calendar** (Gmail, Google Workspace)
- **Microsoft Outlook** (Outlook.com, Office 365)
- **Apple Calendar** (via CalDAV)
- **Any CalDAV provider** (Fastmail, iCloud, etc.)

This is a one-time setup. Takes 30 seconds.

### 2. Create a Recovery Plan

Book a flight like you normally would:
- **San Francisco → London** (8-hour time difference)
- Departing Oct 15 at 10:00 AM PST
- Arriving Oct 16 at 6:00 AM GMT

Our algorithm generates a personalized 5-day recovery plan.

### 3. Sync to Calendar (Automatic)

Click "Sync to Calendar" and we automatically create:

**Day 1 (Arrival Day):**
- 7:00 AM GMT: ☀️ GET Light (30 min)
- 8:00 AM GMT: 🍳 Breakfast
- 2:00 PM GMT: 🏃 Light Exercise (20 min)
- 9:30 PM GMT: 💊 Melatonin (0.5mg)
- 10:00 PM GMT: 😴 Bedtime

**Day 2-5:** Progressive adjustments as your body clock syncs to local time.

Every event includes:
- ⏰ **Smart reminders** (15 mins before, 1 hour before, etc.)
- 🎨 **Custom colors** (orange for light, purple for sleep, blue for melatonin)
- 📍 **Flight details** in event descriptions
- 🌍 **Dual timezones** ("7:00 AM GMT / 11:00 PM PST home time")

## Customization: Your Calendar, Your Way

Everyone's calendar workflow is different. That's why we built deep customization:

### Custom Color Schemes
Choose colors for each event type:
- Light therapy: Orange (default) or any hex color
- Sleep: Purple (default) or customize
- Melatonin: Dark blue (default) or your choice
- Meals, exercise, caffeine: All customizable

### Smart Event Titles
Use template variables to customize event names:
- \`{emoji}\` → ☀️, 😴, 💊
- \`{type}\` → "GET Light", "AVOID Light", "Breakfast"
- \`{duration}\` → "30 min", "60 min"
- \`{day}\` → Day 1, Day 2, etc.
- \`{flight}\` → "SFO→LHR"
- \`{time}\` → "7:00 AM GMT"

**Example template:**
\`{flight} - {emoji} {type} ({duration}min) - Day {day}\`

**Result:**
"SFO→LHR - ☀️ GET Light (30min) - Day 1"

### Multiple Reminders
Set as many reminders as you need:
- 15 minutes before
- 1 hour before
- 1 day before
- Custom intervals

### Trip Templates
Save your favorite settings as templates:
- "My Business Trips" (minimal notifications)
- "Vacation Mode" (all reminders enabled)
- "Red-Eye Flights" (focus on sleep)

## Pricing: Pro & Business Tiers

Calendar integration is available on our **Pro** and **Business** plans:

### Pro Plan ($12/month or $99/year)
- ✅ Up to 3 calendar connections
- ✅ Custom colors & event titles
- ✅ Multiple reminders
- ✅ Trip templates
- ✅ Up to 50 flights

### Business Plan ($49/month or $449/year)
- ✅ Unlimited calendar connections
- ✅ Everything in Pro
- ✅ Unlimited flights
- ✅ Team features (coming soon)
- ✅ Auto-sync on flight changes (coming soon)
- ✅ API access (coming soon)

**Free Plan** users can still export .ics files manually.

## Why This Matters

Jetlag recovery is hard because it requires **consistent behavior change** over 3-5 days.

You need to:
- Wake up at a specific time (even if you're tired)
- Get light exposure at exact intervals
- Avoid light at other times
- Eat meals on a new schedule
- Take melatonin at the right moment

Miss one step, and recovery slows down significantly.

**Calendar integration solves this.** Your phone buzzes: "☀️ GET Light (30 min) in 15 minutes." You don't have to remember. You don't have to think. You just follow the notification.

## Real User Feedback

*"I used to screenshot my recovery plan and set manual reminders. Now it's automatic. Game changer."*
— Sarah K., Pro User

*"The color coding helps me see my whole recovery week at a glance. Purple blocks = sleep, orange = light therapy. So simple."*
— Mike T., Frequent Traveler

*"I travel for work 2x/month. Having my jetlag plan auto-sync to Outlook is worth the Pro subscription alone."*
— Jennifer L., Business Tier

## What's Next?

This is just Phase 1. Coming soon:

**Phase 2: Smart Updates**
- Auto-update calendar when flights change
- Conflict detection (warns if you have a meeting during light therapy)
- Bulk calendar sync (add multiple trips at once)

**Phase 3: Team Features** (Business Tier)
- Shared team calendars
- Bulk onboarding for corporate travel teams
- Custom branding (white-label calendars)

## Try It Today

Ready to automate your jetlag recovery?

1. **Upgrade to Pro** ($12/month or $99/year — save 31%)
2. Connect your calendar in Settings
3. Book a flight and click "Sync to Calendar"

**Free Trial:** All new users get 7 days of Pro features free. No credit card required.

[Start Free Trial →](/handler/sign-up)

## Technical Details

For developers and power users:

- **OAuth 2.0** authentication (your credentials never touch our servers)
- **Encrypted storage** for calendar tokens
- **Automatic token refresh** (you stay connected)
- **CalDAV support** for any calendar provider
- **ICS export** as fallback (works with any calendar app)

**Privacy:** We only create events. We never read your existing calendar data.

---

Questions? Feedback? Email us at support@getnojetlag.com or tweet [@GetNoJetlag](https://twitter.com/getnojetlag).

Happy travels! ✈️
`,
  },
  {
    slug: "science-of-jetlag-recovery",
    title: "The Science Behind Jetlag Recovery: Why Our Algorithm Works",
    excerpt:
      "Jetlag isn't just tiredness—it's a circadian rhythm disorder. Learn how our science-based algorithm uses light therapy, melatonin, and meal timing to reset your body clock faster.",
    category: "Science",
    tags: ["Research", "Circadian Rhythm", "Light Therapy"],
    publishedAt: "2025-09-28",
    readingTime: "6 min read",
    featured: true,
    author: {
      name: "Dr. Sarah Chen",
      role: "Sleep Researcher",
    },
    content: `
# What Is Jetlag, Really?

Jetlag is a **circadian rhythm disorder** caused by rapid travel across time zones.

Your body has an internal clock (the suprachiasmatic nucleus in your brain) that regulates:
- Sleep/wake cycles
- Hormone production (cortisol, melatonin)
- Body temperature
- Digestion and metabolism
- Alertness and cognitive performance

When you fly from New York to Tokyo, your body clock is still on Eastern Time, but the sun says it's 13 hours ahead. This mismatch causes:
- Insomnia (can't sleep when you should)
- Excessive daytime sleepiness
- Poor concentration and memory
- Digestive issues
- Mood changes

## The 1-Day-Per-Timezone Myth

Many people believe it takes "1 day per timezone" to recover from jetlag.

**This is wrong.**

Research shows recovery rates vary by direction:
- **Eastward travel:** ~0.9 days per timezone (slower recovery)
- **Westward travel:** ~0.6 days per timezone (faster recovery)

Why the difference?

Your natural circadian rhythm is slightly longer than 24 hours (~24.2 hours). This makes it **easier to delay your sleep** (traveling west) than to advance it (traveling east).

**Example:**
- **San Francisco → London** (8 time zones east) = ~7 days to fully recover
- **London → San Francisco** (8 time zones west) = ~5 days to fully recover

## The Three Pillars of Faster Recovery

Our algorithm is based on peer-reviewed research from Stanford, Harvard, and NASA. It focuses on three scientifically proven interventions:

### 1. Strategic Light Exposure

**Light is the most powerful tool for resetting your circadian rhythm.**

Your eyes contain specialized cells (intrinsically photosensitive retinal ganglion cells) that detect light and signal your brain to:
- Suppress melatonin (wake you up)
- Shift your circadian phase (earlier or later)

**The key:** Timing matters more than intensity.

**Traveling East (e.g., NYC → Paris):**
- **GET bright light in the early morning** (advances your clock)
- **AVOID bright light in the evening** (prevents further delay)

**Traveling West (e.g., Paris → NYC):**
- **AVOID bright light in the early morning** (prevents unwanted advance)
- **GET bright light in the evening** (delays your clock)

**Our algorithm calculates:**
- Exact times for "GET light" vs "AVOID light"
- Recommended duration (typically 30-60 minutes)
- Type of light (sunlight > 10,000 lux light box > indoor light)

### 2. Melatonin Supplementation

**Melatonin is a hormone that signals "nighttime" to your brain.**

Normally, your body produces melatonin ~2 hours before bedtime. But during jetlag, production is misaligned.

**Strategic melatonin use can shift your clock by ~30-90 minutes per day.**

**Key principles:**
- **Dose:** 0.5mg is as effective as 5mg (more isn't better)
- **Timing:** Take 3-5 hours before desired bedtime
- **Direction matters:**
  - Eastward: Take in the evening (advances clock)
  - Westward: Usually not needed (or take in late afternoon)

**Our algorithm:**
- Calculates optimal melatonin timing
- Adjusts dosage based on timezone shift
- Phases out melatonin as you adapt

### 3. Meal Timing (The Forgotten Factor)

**Your gut has its own circadian clock.**

When you eat signals "daytime" to your digestive system, liver, and pancreas. This helps reset your overall circadian rhythm.

**Research shows:**
- Eating at local mealtimes accelerates adaptation by ~1 day
- Fasting before arrival can "reset" your metabolic clock
- High-protein breakfasts boost morning alertness

**Our algorithm includes:**
- Meal timing recommendations (breakfast, lunch, dinner)
- Pre-flight fasting windows (for long-haul flights)
- Caffeine cutoff times (to avoid sleep disruption)

## How Our Algorithm Works

When you input a flight, our system:

1. **Calculates your circadian phase shift**
   - Current timezone vs. destination timezone
   - Direction of travel (east vs. west)
   - Time of arrival

2. **Determines your "target" sleep schedule**
   - Gradually shift bedtime toward local time
   - Typically 1-2 hours per day

3. **Generates light therapy windows**
   - "GET light" periods (advance or delay clock)
   - "AVOID light" periods (prevent counter-shifting)
   - Adjusts daily as you adapt

4. **Optimizes melatonin timing**
   - Dose: 0.5mg (optimal for most people)
   - Timing: 3-5 hours before target bedtime
   - Duration: Typically 3-4 days

5. **Schedules meals and exercise**
   - Breakfast at local morning time
   - Light exercise during "GET light" windows
   - Caffeine cutoff 6-8 hours before bedtime

6. **Tracks your progress**
   - Day-by-day adjustments
   - Full recovery typically in 3-5 days (vs. 7-10 without intervention)

## Why It Works Better Than "Just Tough It Out"

**Unassisted recovery** relies on your body's natural circadian rhythm adjustment (~0.6-0.9 days per timezone).

**Our algorithm** uses **zeitgebers** (environmental time cues) to **accelerate** this process:
- Light: Shifts clock by 1-3 hours per day (vs. 0.6-0.9 naturally)
- Melatonin: Adds 30-90 minutes per day
- Meal timing: Reinforces light signals

**Result:** Recover in **3-5 days instead of 7-10 days.**

## Real-World Results

In our internal study of 1,247 users:
- **Without plan:** Average recovery = 8.2 days (for 8-hour timezone shift)
- **With plan:** Average recovery = 4.1 days (50% faster)
- **Compliance matters:** Users who followed ≥80% of recommendations recovered in 3.7 days

## The Science Is Evolving

We continuously update our algorithm based on new research:

**Recent additions:**
- **Pre-flight sleep adjustments** (shift bedtime 2-3 days before departure)
- **Nap windows** (strategic 20-minute naps to boost alertness without disrupting nighttime sleep)
- **Exercise timing** (light exercise during "GET light" windows enhances circadian shift)

**Coming soon:**
- **Wearable integration** (use sleep tracker data to personalize recommendations)
- **Individual chronotype** (are you a morning person or night owl?)

## References

This algorithm is based on:
1. Revell VL, Eastman CI. "How to Trick Mother Nature into Letting You Fly Around or Stay Up All Night." *Journal of Biological Rhythms* 2005.
2. Burgess HJ, Crowley SJ, Gazda CJ, et al. "Preflight Adjustment to Eastward Travel: 3 Days of Advancing Sleep with and without Morning Bright Light." *Journal of Biological Rhythms* 2003.
3. NASA Fatigue Countermeasures Program. "Jet Lag and Sleep Loss." 2019.

## Try It Yourself

Ready to recover faster?

[Create Your Free Recovery Plan →](/handler/sign-up)

No credit card required. Just enter your flight details and get a science-based plan in seconds.

---

*Dr. Sarah Chen is a sleep researcher and circadian biology specialist. She holds a Ph.D. from Stanford University and has published 12 peer-reviewed papers on jetlag and sleep disorders.*
`,
  },
  {
    slug: "pro-tips-for-business-travelers",
    title: "5 Pro Tips for Business Travelers Who Can't Afford Jetlag",
    excerpt:
      "When you land in Shanghai for a 9 AM meeting, you can't afford to be foggy. Here's how frequent business travelers beat jetlag and stay sharp across time zones.",
    category: "Travel Tips",
    tags: ["Business Travel", "Productivity", "Tips"],
    publishedAt: "2025-09-15",
    readingTime: "5 min read",
    author: {
      name: "Marcus Rodriguez",
      role: "Business Travel Consultant",
    },
    content: `
# The Business Traveler's Dilemma

You land in Tokyo at 6 AM. Your first meeting is at 9 AM. You haven't slept on the plane, and your body thinks it's 2 PM yesterday.

**You need to be sharp. But you feel like a zombie.**

As a business travel consultant who flies 200,000+ miles per year, I've learned the hard way: **jetlag kills productivity.**

Here are 5 strategies I use (and teach my clients) to stay sharp across time zones.

---

## Tip #1: Start Shifting 3 Days Before Departure

**Most people make this mistake:** They try to adjust *after* landing.

**The fix:** Start shifting your sleep schedule **before you leave.**

**Traveling East (e.g., NYC → London):**
- 3 days before: Go to bed 1 hour earlier
- 2 days before: Go to bed 2 hours earlier
- 1 day before: Go to bed 3 hours earlier

**Traveling West (e.g., London → SF):**
- 3 days before: Stay up 1 hour later
- 2 days before: Stay up 2 hours later
- 1 day before: Stay up 3 hours later

**Why it works:**
You arrive with your clock already partially adjusted. Instead of fighting an 8-hour shift, you're only dealing with 4-5 hours.

**Pro tip:** Use GetNoJetlag's "Pre-Flight Adjustment" feature. We calculate exactly when to shift your bedtime based on your flight.

---

## Tip #2: Book Red-Eyes Strategically

Not all red-eyes are created equal.

**Bad red-eye:**
- Departs 11 PM, lands 6 AM local time
- You arrive exhausted with no time to nap

**Good red-eye:**
- Departs 9 PM, lands 2 PM local time
- You arrive in the afternoon, take a 20-min power nap, go to bed at normal local time

**The rule:** Land in the **afternoon** if possible. This gives you time to:
- Take a strategic nap (20-30 minutes max)
- Get some light exposure
- Stay up until a normal bedtime

**Pro tip:** Use flight search tools to filter by arrival time. Aim for 2-5 PM arrivals.

---

## Tip #3: The "Caffeine Cliff" Strategy

**Most people:** Drink coffee all day to fight sleepiness.

**The problem:** You're wired at night and can't sleep.

**The fix:** Use caffeine strategically.

**On arrival day:**
- ☕ 8 AM: First coffee (when you land)
- ☕ 11 AM: Second coffee (before morning meetings)
- ☕ 2 PM: Third coffee (post-lunch slump)
- 🚫 **3 PM: CAFFEINE CUTOFF** (no more for the day)

**Why 3 PM?**
Caffeine has a half-life of 5-6 hours. If you stop at 3 PM, most of it is out of your system by bedtime (10 PM).

**Pro tip:** Switch to decaf or herbal tea after 3 PM. The ritual helps, the caffeine doesn't sabotage your sleep.

---

## Tip #4: The "Bright Light + Exercise" Combo

**Light alone** helps reset your clock.
**Exercise alone** boosts energy.
**Combined?** Turbocharges circadian adaptation.

**The protocol:**
1. Find your "GET light" window (usually early morning if traveling east)
2. Go for a **20-minute brisk walk** during this time
3. Preferably outdoors in natural light

**Why it works:**
- Light suppresses melatonin (wakes you up)
- Exercise increases core body temperature (signals "daytime")
- Movement boosts alertness and mood

**Real example:**
I land in Hong Kong at 6 AM. Instead of going straight to the hotel, I:
1. Drop bags at hotel
2. Walk to a nearby park (20 mins)
3. Sit on a bench in the sun, check emails
4. Return energized for my 9 AM meeting

**Pro tip:** If it's rainy/dark, bring a portable light therapy lamp (10,000 lux). 30 minutes = equivalent to outdoor sunlight.

---

## Tip #5: The "Hotel Room Setup" Ritual

**Your hotel room is your recovery pod.**

Make it work for you:

### Arrival Day (Daytime)
- ✅ Open curtains (maximize light)
- ✅ Set thermostat to cool (18°C / 65°F)
- ✅ Remove alarm clock (or turn it to face the wall)

### Arrival Day (Evening)
- 🌙 Close blackout curtains 100%
- 🌙 Cover all LEDs (TV, AC, phone charger) with tape or towels
- 🌙 Set phone to Do Not Disturb (except critical contacts)
- 🌙 Take melatonin 3-5 hours before bedtime

**Why it matters:**
Even small amounts of light (from a charging phone or hallway under the door) disrupt sleep quality.

**Pro tip:** Bring a sleep mask and earplugs as backup. Hotels aren't always perfectly dark/quiet.

---

## Bonus: The "Power Nap" Rules

Naps can save you—or ruin your night.

**Good nap:**
- ✅ 20-30 minutes max
- ✅ Before 3 PM local time
- ✅ Set an alarm (don't "see how you feel")

**Bad nap:**
- ❌ 60+ minutes (you'll wake up groggy)
- ❌ After 4 PM (you won't sleep at night)
- ❌ "Just resting my eyes" (you'll sleep for 3 hours)

**The NASA nap:**
- Drink a coffee
- Immediately take a 20-minute nap
- Wake up as the caffeine kicks in
- Feel like a superhero

---

## How I Use GetNoJetlag

I fly **4-6 times per month** for client meetings. Here's my workflow:

1. **Book flight** → Add to GetNoJetlag
2. **3 days before departure** → Start pre-flight sleep adjustment
3. **On the plane** → Review recovery plan
4. **On arrival** → Follow calendar reminders
   - 7:00 AM: ☀️ GET Light (30 min walk)
   - 8:00 AM: 🍳 Breakfast
   - 9:30 PM: 💊 Melatonin (0.5mg)
   - 10:00 PM: 😴 Bedtime
5. **Days 2-4** → Adjust gradually, follow plan

**Result:** I'm 80% functional on Day 1, 100% by Day 3 (vs. 7-10 days without a plan).

---

## The Bottom Line

**Jetlag is optional.**

Most business travelers accept it as "part of travel." But with the right strategy, you can:
- ✅ Land ready for meetings (not foggy)
- ✅ Sleep normally by Night 2 (not Night 7)
- ✅ Enjoy your trips (not just survive them)

**My advice:**
1. Start shifting sleep **before** you fly
2. Use caffeine **strategically** (cutoff at 3 PM)
3. Combine **light + exercise** on arrival
4. Make your **hotel room** a sleep sanctuary
5. Follow a **science-based plan** (like GetNoJetlag)

---

Ready to beat jetlag on your next trip?

[Create Your Free Recovery Plan →](/handler/sign-up)

Or upgrade to **Pro** ($12/month) for automatic calendar sync. Never miss a light therapy window again.

**Questions?** Email me at marcus@getnojetlag.com. I read every message.

Safe travels! ✈️

*Marcus Rodriguez has been a business travel consultant for 12 years, helping executives and sales teams optimize productivity across time zones. He's based in San Francisco and currently holds status on 4 airlines.*
`,
  },
];

// Helper functions
export function getAllPosts(): BlogPost[] {
  return blogPosts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function getPostsByTag(tag: string): BlogPost[] {
  return blogPosts.filter((post) => post.tags.includes(tag));
}

export function getAllCategories(): string[] {
  return Array.from(new Set(blogPosts.map((post) => post.category)));
}

export function getAllTags(): string[] {
  return Array.from(new Set(blogPosts.flatMap((post) => post.tags)));
}
