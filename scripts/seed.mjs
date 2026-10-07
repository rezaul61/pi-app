import { scryptSync, randomBytes } from "crypto";

/* PI — Phase 1 seed. Emits SQL to stdout. Password for all demo users: pidemo314 */
const salt = randomBytes(16).toString("hex");
const hash = `scrypt:${salt}:${scryptSync("pidemo314", salt, 64).toString("hex")}`;

const U = {
  amina: "a0000000-0000-4000-8000-000000000001",
  leila: "a0000000-0000-4000-8000-000000000002",
  jonas: "a0000000-0000-4000-8000-000000000003",
  sofia: "a0000000-0000-4000-8000-000000000004",
  malik: "a0000000-0000-4000-8000-000000000005",
  dana: "a0000000-0000-4000-8000-000000000006",
  priya: "a0000000-0000-4000-8000-000000000007",
  theo: "a0000000-0000-4000-8000-000000000008",
  meridian: "a0000000-0000-4000-8000-000000000009",
};
const C = {
  orbital: "b0000000-0000-4000-8000-000000000001",
  pedagogy: "b0000000-0000-4000-8000-000000000002",
  ml: "b0000000-0000-4000-8000-000000000003",
  climate: "b0000000-0000-4000-8000-000000000004",
  bio: "b0000000-0000-4000-8000-000000000005",
  quantum: "b0000000-0000-4000-8000-000000000006",
};
const P = {
  leilaResearch: "c0000000-0000-4000-8000-000000000001",
  aminaArticle: "c0000000-0000-4000-8000-000000000002",
  danaProject: "c0000000-0000-4000-8000-000000000003",
  sofiaPost: "c0000000-0000-4000-8000-000000000004",
  jonasPoll: "c0000000-0000-4000-8000-000000000005",
  priyaResearch: "c0000000-0000-4000-8000-000000000006",
  theoPost: "c0000000-0000-4000-8000-000000000007",
  aminaNetwork: "c0000000-0000-4000-8000-000000000008",
  malikPost: "c0000000-0000-4000-8000-000000000009",
  meridianEvent: "c0000000-0000-4000-8000-000000000010",
  leilaArticle: "c0000000-0000-4000-8000-000000000011",
  danaArticleML: "c0000000-0000-4000-8000-000000000012",
  sofiaBioResearch: "c0000000-0000-4000-8000-000000000013",
  danaMediaDemo: "c0000000-0000-4000-8000-000000000014",
};
const CONV1 = "d0000000-0000-4000-8000-000000000001";
const CONV2 = "d0000000-0000-4000-8000-000000000002";

const user = (id, name, username, headline, bio, location, institution, accent, role, roles, interests, goals, verified, hours) =>
  `INSERT INTO users (id,name,username,email,pass_hash,headline,bio,location,institution,accent,primary_role,roles,interests,goals,is_verified,verified_at,onboarded,created_at)
   VALUES ('${id}','${name}','${username}','${username}@pi.network','${hash}','${headline}','${bio}','${location}','${institution}','${accent}','${role}','{${roles}}','{${interests}}','{${goals}}',${verified},${verified ? "now() - interval '40 days'" : "NULL"},true,now() - interval '${hours} hours');`;

const q = (s) => s.replace(/'/g, "''");

const userLines = [
  user(U.amina, "Dr. Amina Rahmani", "amina", q("Computational astrobiology — searching for life in subsurface oceans"), q("PI-funded researcher modeling Europa's ice-ocean interface. Previously JPL. I share methods and data, not hype."), q("Pasadena, CA"), q("Helios Orbital Institute"), "cyan", "researcher", '"researcher"', '"Space & Astronomy","AI & Machine Learning","Climate Science","Data Science"', '"Research","Collaborate","Network"', true, 500),
  user(U.leila, "Prof. Leila Haddad", "leila", q("Professor of Learning Sciences — evidence over tradition"), q("Twenty years studying how people actually learn. I run Pedagogy Lab and the Seminar Method Project."), q("Oxford, UK"), q("Meridian University"), "amber", "teacher", '"teacher","researcher"', '"Education","Psychology","AI & Machine Learning","Public Policy"', '"Share knowledge","Research","Learn"', true, 900),
  user(U.jonas, "Jonas Weber", "jonas", q("Secondary school teacher — mathematics with meaning"), q("I teach teenagers to think in proofs and probabilities. Building open curricula anyone can fork."), q("Berlin, DE"), q("Galileo Schools"), "mint", "teacher", '"teacher"', '"Education","Mathematics","Economics"', '"Learn","Share knowledge","Network"', true, 700),
  user(U.sofia, "Sofia Işık", "sofia", q("Neuroscience undergrad & research assistant"), q("Final-year student studying sleep and memory. First-author paper under review. Asking questions daily."), q("Istanbul, TR"), q("Bosphorus University"), "rose", "student", '"student","researcher"', '"Neuroscience","Data Science","Health & Medicine","Psychology"', '"Learn","Find opportunities","Research"', false, 300),
  user(U.malik, "Malik Osei", "malik", q("Founder — TerraGrid, climate infrastructure"), q("Building microgrid software for West African cities. Ex-energy systems engineer. Here for collaborators and honest feedback."), q("Accra, GH"), q("TerraGrid"), "aurora", "entrepreneur", '"entrepreneur"', '"Climate Science","Entrepreneurship","Energy","Economics"', '"Collaborate","Find opportunities","Build my career"', false, 400),
  user(U.dana, "Dana Kovács", "dana", q("Staff engineer — accessible design systems"), q("I build GlassUI, an open-source accessible component kit. Performance and a11y are the same fight."), q("Prague, CZ"), q("Independent / OSS"), "indigo", "developer", '"developer"', '"Design","AI & Machine Learning","Data Science","Cybersecurity"', '"Share knowledge","Collaborate","Learn"', true, 800),
  user(U.priya, "Dr. Priya Nair", "priya", q("Neuroscientist — memory consolidation during sleep"), q("Postdoc running longitudinal sleep studies. Open data advocate. I review for two journals and mentor undergrads."), q("Zurich, CH"), q("CorTex Labs"), "violet", "researcher", '"researcher"', '"Neuroscience","Health & Medicine","Data Science","Mathematics"', '"Research","Network","Share knowledge"', true, 650),
  user(U.theo, "Théo Laurent", "theo", q("First-year maths student"), q("Learning how to learn. Here to find mentors and prove to myself that I belong in mathematics."), q("Lyon, FR"), q("Université de Lyon"), "cyan", "student", '"student"', '"Mathematics","Physics","Philosophy"', '"Learn","Find opportunities"', false, 100),
  user(U.meridian, "Meridian University", "meridian", q("Research university — verified institution"), q("Official presence of Meridian University: calls for papers, scholarships, public lectures and open positions."), q("Oxford, UK"), q("Meridian University"), "indigo", "institution", '"institution"', '"Education","Public Policy","Law","Mathematics"', '"Share knowledge"', true, 1200),
];

const community = (id, slug, name, tagline, desc, cat, accent, by, days) =>
  `INSERT INTO communities (id,slug,name,tagline,description,category,accent,created_by,created_at)
   VALUES ('${id}','${slug}','${name}','${q(tagline)}','${q(desc)}','${cat}','${accent}','${by}',now() - interval '${days} days');`;

const communityLines = [
  community(C.orbital, "orbital", "Orbital Sciences", q("Missions, planets and the search for life"), q("A space for mission scientists, astrobiologists, engineers and serious enthusiasts. Share datasets, preprints, instrument notes and launch-night stories. No pseudoscience — cite or be corrected kindly."), "Space", "cyan", U.amina, 300),
  community(C.pedagogy, "pedagogy-lab", "Pedagogy Lab", q("How people actually learn"), q("Teachers, researchers and curriculum designers testing what works in real classrooms. Weekly reading circle, classroom experiments, and honest post-mortems of failed lessons."), "Education", "amber", U.leila, 400),
  community(C.ml, "ml-foundations", "ML Foundations", q("From linear algebra to systems"), q("Rigorous machine-learning discussion: papers, derivations, reproducibility and production lessons. Beginners welcome — precision required."), "Research", "violet", U.dana, 350),
  community(C.climate, "climate-tech", "Climate Tech", q("Deployable solutions, measured impact"), q("Founders, engineers and policy researchers working on mitigation and adaptation. Pilots over decks; measured impact over storytelling."), "Climate", "mint", U.malik, 200),
  community(C.bio, "bio-frontiers", "Bio Frontiers", q("Neuroscience, medicine and open biology"), q("Preprints, protocols and career advice for the life sciences. Strong culture of crediting contributions and sharing negative results."), "Health", "rose", U.priya, 280),
  community(C.quantum, "quantum-circle", "Quantum Circle", q("Quantum computing without the mysticism"), q("Error correction, algorithms, hardware roadmaps — discussed carefully. Monthly paper club hosted by verified researchers."), "Physics", "indigo", U.meridian, 150),
];

const member = (cid, uid, role, days) =>
  `INSERT INTO community_members (community_id,user_id,role,joined_at) VALUES ('${cid}','${uid}','${role}',now() - interval '${days} days');`;

const memberLines = [
  member(C.orbital, U.amina, "expert", 290), member(C.orbital, U.theo, "member", 20),
  member(C.orbital, U.meridian, "moderator", 295),
  member(C.pedagogy, U.leila, "moderator", 390), member(C.pedagogy, U.jonas, "expert", 380),
  member(C.pedagogy, U.sofia, "member", 60), member(C.pedagogy, U.meridian, "member", 300),
  member(C.ml, U.dana, "moderator", 340), member(C.ml, U.theo, "member", 15),
  member(C.ml, U.priya, "member", 200), member(C.ml, U.sofia, "member", 90),
  member(C.climate, U.malik, "moderator", 190), member(C.climate, U.amina, "member", 100),
  member(C.bio, U.priya, "moderator", 270), member(C.bio, U.sofia, "member", 80),
  member(C.quantum, U.meridian, "moderator", 140), member(C.quantum, U.dana, "member", 100),
];

const post = (id, author, kind, title, content, vis, tags, meta, hours, communityId = null) =>
  `INSERT INTO posts (id,author_id,community_id,kind,title,content,visibility,tags,meta,created_at)
   VALUES ('${id}','${author}',${communityId ? `'${communityId}'` : "NULL"},'${kind}','${q(title)}',$${"$"}${q(content)}$${"$"},'${vis}','{${tags}}','${meta}'::jsonb,now() - interval '${hours} hours');`;

const postLines = [
  post(P.danaMediaDemo, U.dana, "post", "",
    q(`We just got the new hardware prototypes for the lab. Setting up the rigs now. The form factor is incredible, but the thermal management is what really stands out under load.

Swipe through for the teardown and thermal imaging.`),
    "public", '"Hardware","AI & Machine Learning"', 
    JSON.stringify({ 
      mediaUrls: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80"
      ] 
    }), 2),
  post(P.leilaResearch, U.leila, "research", "Adaptive tutoring, six months in",
    q(`Six months into our adaptive tutoring trial across 14 classrooms, the pattern is stable: students using mastery-gated progression outperformed static-curriculum peers by 0.4 standard deviations — but only when teachers reviewed the analytics weekly.

The tool didn't replace teaching. It made good teaching louder.

Full preprint drops next week. Happy to share the anonymized dataset with verified researchers here.`),
    "public", '"Education","AI & Machine Learning"', "{}", 50),
  post(P.aminaArticle, U.amina, "article", "Subsurface oceans are our best bet for astrobiology — here's why",
    q(`Every few months, another headline promises life on Mars "soon." I study the places where the case is actually stronger: the ice-covered oceans of Europa and Enceladus.

Three reasons the math favors them.

First: liquid water stability. Europa's ocean has likely existed for billions of years — long enough for chemistry to become biology, twice over.

Second: energy. Tidal flexing drives hydrothermal circulation at the seafloor, the same environment that may have birthed life here.

Third: access. Enceladus literally sprays its ocean into space. We can taste it without drilling a meter.

The honest caveat: ice-penetrating radar remains brutally hard at these depths, and both flagship missions carry instruments we'd trade a decade to upgrade. But if you ask where I'd point the next generation of orbiters — the answer is down, into the dark, under the ice.`),
    "public", '"Space & Astronomy","Data Science"', "{}", 30),
  post(P.danaProject, U.dana, "project", "GlassUI v0.9 — accessible glass components, now with spring physics",
    q(`I just shipped GlassUI 0.9: an open-source React kit for glassmorphism that doesn't sacrifice accessibility for aesthetics.

Every component ships with: reduced-motion fallbacks, contrast-checked tokens, and a performance budget enforced in CI.

I'm looking for two collaborators: one person who cares about RTL layout, one who wants to own the docs site. Verified devs — message me.`),
    "public", '"Design","Data Science"', "{}", 12),
  post(P.sofiaPost, U.sofia, "post", "",
    q(`Submitting my first first-author paper this week (sleep spindle density and memory consolidation, n=84).

Terrified. Excited. Mostly grateful to everyone on PI who reviewed my pre-registration. This network taught me that good science is a team sport.

Wish me luck.`),
    "public", '"Neuroscience"', "{}", 8),
  post(P.jonasPoll, U.jonas, "poll", "",
    q(`Teachers of PI: when you grade, what should matter most?

Genuinely curious — our department is rewriting its assessment policy this term and I want your reasoning, not just your vote.`),
    "public", '"Education","Mathematics"',
    JSON.stringify({ options: [{ label: "Mastery of concepts" }, { label: "Consistent effort" }, { label: "Creative synthesis" }, { label: "Exam performance" }] }), 26),
  post(P.priyaResearch, U.priya, "research", "Two years of sleep data, one uncomfortable finding",
    q(`Our longitudinal dataset (412 participants, 2 years, wearable + lab validated) just hit its pre-registered endpoint.

Headline: the memory benefit of sleep is not evenly distributed. Participants with irregular sleep timing got almost no consolidation benefit even at 8 hours of duration. Regularity beat duration.

This challenges how we've been advising students for a decade. Open dataset and notebooks: link in my Vault. Reviewers welcome from Bio Frontiers and ML Foundations.`),
    "public", '"Neuroscience","Data Science","Health & Medicine"', "{}", 44),
  post(P.theoPost, U.theo, "post", "",
    q(`Honest question from a first-year: everyone says "linear algebra is the language of ML," but the proofs feel abstract and the applications feel like magic tricks.

What resource made it CLICK for you? Not the textbook you were assigned — the one that actually worked.`),
    "public", '"Mathematics"', "{}", 5),
  post(P.aminaNetwork, U.amina, "post", "",
    q(`Sharing with my network only for now: our team has funding approved for a postdoc collaborator on ice-ocean simulation (GCM + Bayesian inversion). 

Not a public listing yet — I'd rather find someone through people I trust. If this is your world, or you know the perfect person, my messages are open.`),
    "network", '"Space & Astronomy"', "{}", 20),
  post(P.malikPost, U.malik, "post", "",
    q(`Six months of TerraGrid pilot data from Koforidua: 11% reduction in diesel consumption across 400 connections, peak-shaving working exactly as simulated.

The part nobody tells founders: the spreadsheets were the easy bit. Trust, maintenance contracts, and a technician named Efua who fixes anything — that's the real infrastructure.

Building in public. Ask me anything.`),
    "public", '"Climate Science","Entrepreneurship","Energy"', "{}", 16),
  post(P.meridianEvent, U.meridian, "event", "Meridian Open Research Evening",
    q(`Our annual Open Research Evening returns to the Meridian Atrium. Twelve labs open their doors: live demos, poster sessions, and honest conversations with researchers about what the work is really like.

This year's spotlight: learning sciences, quantum photonics, and planetary chemistry.

Free entry. Registration required, members of Pedagogy Lab first in line.`),
    "public", '"Education"', JSON.stringify({ startsAt: new Date(Date.now() + 12 * 86400000).toISOString(), location: "Meridian Atrium, Oxford", online: false }), 36, C.pedagogy),
  post(P.leilaArticle, U.leila, "article", "The seminar method still wins. The data is not subtle.",
    q(`WeCompared discussion-first seminars against lecture-plus-quiz across 31 university courses. Same content, same assessment.

Seminar students didn't just score higher (d = 0.52). They kept scoring higher eight months later on unseen transfer problems — the only outcome that actually matters.

Why? Not engagement. Not motivation. Retrieval under social pressure, repeatedly, with a skilled moderator who lets silence do the work.

The catch: seminars scale badly. Which is precisely why teacher development matters more than any ed-tech purchase this decade.`),
    "public", '"Education"', "{}", 60),
  post(P.danaArticleML, U.dana, "article", "Reproducibility is a feature — treat it like one",
    q(`I reviewed 14 "state of the art" repos cited in this year's top venues. Nine did not run out of the box. Four could not reproduce their own headline table.

So in ML Foundations we're starting a reproducibility badge: community members re-run your code before your post gets the "Verified Replication" tag.

Researchers: publish your seeds. Engineers: pin your environments. Everyone: stop citing results nobody has checked.`),
    "public", '"AI & Machine Learning","Data Science"', "{}", 70, C.ml),
  post(P.sofiaBioResearch, U.sofia, "research", "What 84 nights of EEG taught me about being a student",
    q(`Our lab's student-sleep study wrapped data collection. Informal observations before analysis begins:

1. The "all-nighter before the exam" group's recall collapsed on day-3 follow-up — exactly as the consolidation literature predicts.
2. Participants who studied in 25-minute spaced blocks retained more with 40% less total time.
3. Everyone underestimates how irregular their sleep schedule is until they see their own hypnogram.

Analysis notebooks coming to Bio Frontiers once pre-registered hypotheses are locked.`),
    "public", '"Neuroscience","Health & Medicine"', "{}", 95, C.bio),
];

const comment = (postId, author, content, hours) =>
  `INSERT INTO comments (post_id,author_id,content,created_at) VALUES ('${postId}','${author}',$${"$"}${q(content)}$${"$"},now() - interval '${hours} hours');`;

const commentLines = [
  comment(P.aminaArticle, U.leila, q("The Enceladus point is the one I quote in my science-methods seminar — 'we can taste it without drilling a meter' is going on a slide. With credit."), 28),
  comment(P.aminaArticle, U.dana, q("Ice-penetrating radar question: is the bottleneck antenna power or the scattering model? Asking as someone who only plays a physicist on weekends."), 26),
  comment(P.sofiaPost, U.priya, q("Congratulations, Sofia. The pre-registration discipline you showed here will matter more than the result — reviewers notice. Proud of you."), 6),
  comment(P.leilaResearch, U.jonas, q("'The tool made good teaching louder' — that's the sentence our whole ed-tech budget should be judged against. Sharing with my department."), 40),
  comment(P.theoPost, U.dana, q("3Blue1Brown's Essence of Linear Algebra, then immediately after, code a tiny neural net by hand. Geometry first, arithmetic second. It clicks when you build."), 4),
  comment(P.theoPost, U.priya, q("Seconding the visual route. Also: Gilbert Strang's MIT lectures are free and still the gold standard for intuition."), 3),
  comment(P.jonasPoll, U.leila, q("Voted mastery — but only because 'creative synthesis' is so hard to assess fairly at scale. The honest answer is that assessment format constrains the answer more than philosophy does."), 24),
];

const reaction = (postId, uid, type) =>
  `INSERT INTO reactions (post_id,user_id,type) VALUES ('${postId}','${uid}','${type}') ON CONFLICT DO NOTHING;`;

const reactionLines = [
  reaction(P.aminaArticle, U.leila, "appreciate"), reaction(P.aminaArticle, U.sofia, "curious"),
  reaction(P.aminaArticle, U.priya, "insightful"), reaction(P.aminaArticle, U.theo, "curious"),
  reaction(P.aminaArticle, U.malik, "appreciate"),
  reaction(P.leilaResearch, U.jonas, "insightful"), reaction(P.leilaResearch, U.sofia, "insightful"),
  reaction(P.leilaResearch, U.amina, "appreciate"),
  reaction(P.sofiaPost, U.leila, "appreciate"), reaction(P.sofiaPost, U.priya, "appreciate"),
  reaction(P.sofiaPost, U.jonas, "appreciate"), reaction(P.sofiaPost, U.dana, "appreciate"),
  reaction(P.priyaResearch, U.sofia, "insightful"), reaction(P.priyaResearch, U.dana, "curious"),
  reaction(P.theoPost, U.dana, "appreciate"), reaction(P.malikPost, U.amina, "insightful"),
  reaction(P.malikPost, U.dana, "appreciate"), reaction(P.danaProject, U.theo, "curious"),
  reaction(P.danaProject, U.sofia, "appreciate"), reaction(P.leilaArticle, U.jonas, "insightful"),
];

const conn = (a, b, status, days) =>
  `INSERT INTO connections (requester_id,addressee_id,status,created_at) VALUES ('${a}','${b}','${status}',now() - interval '${days} days');`;

const connLines = [
  conn(U.leila, U.amina, "accepted", 200), conn(U.jonas, U.amina, "accepted", 150),
  conn(U.amina, U.dana, "accepted", 120), conn(U.leila, U.sofia, "accepted", 90),
  conn(U.leila, U.jonas, "accepted", 300), conn(U.priya, U.sofia, "accepted", 60),
  conn(U.dana, U.theo, "accepted", 30), conn(U.priya, U.amina, "accepted", 45),
  conn(U.malik, U.amina, "pending", 2), conn(U.theo, U.sofia, "pending", 1),
  `INSERT INTO follows (follower_id,following_id) VALUES ('${U.theo}','${U.amina}');`,
  `INSERT INTO follows (follower_id,following_id) VALUES ('${U.sofia}','${U.leila}');`,
  `INSERT INTO follows (follower_id,following_id) VALUES ('${U.malik}','${U.leila}');`,
];

const msg = (conv, sender, content, hours) =>
  `INSERT INTO messages (conversation_id,sender_id,content,created_at) VALUES ('${conv}','${sender}',$${"$"}${q(content)}$${"$"},now() - interval '${hours} hours');`;

const msgLines = [
  `INSERT INTO conversations (id,created_at,last_message_at) VALUES ('${CONV1}',now() - interval '30 hours',now() - interval '4 hours');`,
  `INSERT INTO participants (conversation_id,user_id,last_read_at) VALUES ('${CONV1}','${U.amina}',now() - interval '5 hours'),('${CONV1}','${U.leila}',now() - interval '4 hours');`,
  msg(CONV1, U.leila, q("Amina — your subsurface oceans piece. Could I adapt the energy-sources section for my science-methods seminar? Full credit, obviously."), 30),
  msg(CONV1, U.amina, q("Of course — use whatever helps. There's a figure in my Vault with the tidal-flexing schematic if that's easier for students."), 29),
  msg(CONV1, U.leila, q("Perfect. Also, we're short one external reviewer for the adaptive tutoring preprint. Any chance you'd have ninety minutes this month?"), 26),
  msg(CONV1, U.amina, q("For your study? Gladly. Send the draft — education stats are outside my core but that's exactly why I can be the 'hostile generalist' reader."), 25),
  msg(CONV1, U.leila, q("Exactly the reader we need. Draft coming Thursday. The seminar-method article is live now, by the way — would love your take on the transfer-problem result."), 4),
  `INSERT INTO conversations (id,created_at,last_message_at) VALUES ('${CONV2}',now() - interval '20 hours',now() - interval '1 hours');`,
  `INSERT INTO participants (conversation_id,user_id,last_read_at) VALUES ('${CONV2}','${U.amina}',now() - interval '10 hours'),('${CONV2}','${U.dana}',now() - interval '1 hours');`,
  msg(CONV2, U.amina, q("Dana, the GlassUI docs are genuinely excellent. Quoting your contrast-budget approach in my lab's web redesign."), 20),
  msg(CONV2, U.dana, q("That means a lot! v1.0 adds the orbital loader I promised — inspired by PI's design language, actually."), 18),
  msg(CONV2, U.dana, q("Quick question — does your institute ever open-source simulation tooling? I know a few devs who'd love to contribute."), 1),
];

const notif = (uid, actor, type, body, href, hours, read) =>
  `INSERT INTO notifications (user_id,actor_id,type,body,href,read_at,created_at)
   VALUES ('${uid}',${actor ? `'${actor}'` : "NULL"},'${type}','${q(body)}','${href}',${read ? `now() - interval '${hours - 1 < 0 ? 0 : hours - 1} hours'` : "NULL"},now() - interval '${hours} hours');`;

const notifLines = [
  notif(U.amina, null, "system", "Welcome to PI, Amina. Your researcher identity is verified — the network is yours.", "/home", 400, true),
  notif(U.amina, U.leila, "comment", "Prof. Leila Haddad commented on your post.", `/post/${P.aminaArticle}`, 28, true),
  notif(U.amina, U.malik, "connection_request", "Malik Osei wants to connect with you.", "/network", 4, true),
  notif(U.amina, U.dana, "message", "Dana Kovács sent you a message.", `/messages/${CONV2}`, 1, false),
  notif(U.amina, null, "opportunity_alert", "New match (97%): Research Engineer — Planetary Machine Learning", "/opportunities", 200, true),
  notif(U.amina, null, "opportunity_alert", "Closing in 72h: Open Research Infrastructure Awards", "/opportunities", 18, false),
  notif(U.amina, null, "opportunity_alert", "Closing in 12h: Civic Climate Microgrants — Round 4", "/opportunities", 2, false),
  notif(U.priya, U.sofia, "system", "Your Bio Frontiers research update is trending in the community.", `/post/${P.sofiaBioResearch}`, 50, true),
];

const eventLines = [
  `INSERT INTO events (community_id,title,description,starts_at,location,online,created_by)
   VALUES ('${C.pedagogy}','${q("Meridian Open Research Evening")}','${q("Twelve labs open their doors: demos, posters and honest conversation.")}',now() + interval '12 days','${q("Meridian Atrium, Oxford")}',false,'${U.leila}');`,
  `INSERT INTO events (community_id,title,description,starts_at,location,online,created_by)
   VALUES ('${C.orbital}','${q("Virtual Deep-Sky Party: Enceladus Watch")}','${q("Live telescope streams and Q&A with mission scientists.")}',now() + interval '20 days','',true,'${U.amina}');`,
  `INSERT INTO events (community_id,title,description,starts_at,location,online,created_by)
   VALUES ('${C.ml}','${q("Paper Reading Club: Diffusion Models")}','${q("Weekly reading circle. This week: classifier-free guidance, derived carefully.")}',now() + interval '5 days','',true,'${U.dana}');`,
];

const opp = (kind, title, org, desc, loc, remote, funding, deadlineDays, eligibility, tags) =>
  `INSERT INTO opportunities (kind,title,org,description,location,remote,funding,deadline,eligibility,tags,apply_url)
   VALUES ('${kind}','${q(title)}','${q(org)}','${q(desc)}','${q(loc)}',${remote},'${q(funding)}',now() + interval '${deadlineDays} days','{${eligibility}}','{${tags}}','https://apply.pi.network/${kind}s');`;

const oppLines = [
  opp("job", "Research Engineer — Planetary Machine Learning", "Helios Orbital Institute", q("Build Bayesian models of icy-moon oceans alongside mission scientists. Publish openly, ship carefully."), "Pasadena, CA", true, "$120k–150k + research budget", 25, '"Researchers","Developers","All backgrounds"', '"Space & Astronomy","AI & Machine Learning","Data Science"'),
  opp("scholarship", "Meridian Graduate Scholarship — STEM Pathways", "Meridian University", q("Full funding for two years of graduate study, including a verified-mentor matching program through PI."), "Oxford, UK", false, "Full tuition + £19k stipend", 11, '"Students"', '"Education","Mathematics","Physics"'),
  opp("conference", "ICML 2026 — Call for Papers & Travel Grants", "International Machine Learning Society", q("Submit by the deadline; reproducibility statements are mandatory this year. Travel grants for students and early-career researchers."), "Vienna, AT", false, "Travel grants available", 40, '"All backgrounds"', '"AI & Machine Learning","Data Science"'),
  opp("grant", "Civic Climate Microgrants — Round 4", "Terra Fund", q("€5k–€25k for deployable local climate projects with measurable outcomes. Decision in six weeks, no deck required — a clear plan is enough."), "Remote", true, "€5,000–€25,000", 9, '"Entrepreneurs","Researchers","Students"', '"Climate Science","Entrepreneurship","Energy"'),
  opp("internship", "Neurodata Summer Internship", "CorTex Labs", q("Ten weeks embedded with the sleep-lab analysis team. Real datasets, real reviews, authorship possible. PI verified students preferred."), "Zurich, CH", true, "Paid (CHF 3,200/month)", 30, '"Students"', '"Neuroscience","Data Science","Health & Medicine"'),
  opp("job", "Science Educator, Digital Curricula", "Galileo Schools", q("Design mastery-based digital math curricula used by 40k students. Teachers only — we build with classrooms, not around them."), "Berlin, DE", true, "$70k–90k", 20, '"Teachers"', '"Education","Mathematics"'),
  opp("grant", "Open Research Infrastructure Awards", "Arcadia Foundation", q("Up to $50k for tooling that makes research more reproducible: datasets, pipelines, review infrastructure."), "Remote", true, "Up to $50,000", 45, '"Researchers","Developers","All backgrounds"', '"Data Science","Cybersecurity","AI & Machine Learning"'),
  opp("conference", "World Pedagogy Forum 2026", "Global Education Alliance", q("Three days on what actually works in classrooms. Practitioner keynotes, no vendor stages. Early-bird pricing until the deadline."), "Singapore, SG", false, "Early-bird rates", 60, '"Teachers","Researchers","All backgrounds"', '"Education","Public Policy","Psychology"'),
];

const vaultLines = [
  `INSERT INTO vault_items (user_id,kind,title,note,post_id,tags,created_at)
   VALUES ('${U.amina}','post','${q("Sofia's student-sleep observations")}','${q("Points 1 and 2 for my mentoring slides.")}','${P.sofiaBioResearch}','{"Neuroscience"}',now() - interval '2 days');`,
  `INSERT INTO vault_items (user_id,kind,title,note,tags,created_at)
   VALUES ('${U.amina}','note','${q("Talk outline: oceans under the ice")}','${q("Open with Enceladus plume video. Three-part structure: water, energy, access. Close with the honest radar caveat.")}','{"talks","astrobiology"}',now() - interval '6 days');`,
  `INSERT INTO vault_items (user_id,kind,title,note,url,tags,created_at)
   VALUES ('${U.amina}','link','${q("Europa Clipper instrument notes")}','${q("Radar constraints section — cite in the article revision.")}','https://europa.nasa.gov/','{"astrobiology","missions"}',now() - interval '9 days');`,
  `INSERT INTO saved_opportunities (user_id,opportunity_id)
   SELECT '${U.amina}', id FROM opportunities WHERE org IN ('Terra Fund','International Machine Learning Society');`,
];

const pollVoteLines = [
  `INSERT INTO poll_votes (post_id,user_id,option_index) VALUES ('${P.jonasPoll}','${U.leila}',0);`,
  `INSERT INTO poll_votes (post_id,user_id,option_index) VALUES ('${P.jonasPoll}','${U.sofia}',2);`,
  `INSERT INTO poll_votes (post_id,user_id,option_index) VALUES ('${P.jonasPoll}','${U.priya}',0);`,
  `INSERT INTO poll_votes (post_id,user_id,option_index) VALUES ('${P.jonasPoll}','${U.theo}',1);`,
  `INSERT INTO poll_votes (post_id,user_id,option_index) VALUES ('${P.jonasPoll}','${U.dana}',2);`,
];

const lines = [
  "BEGIN;",
  `DELETE FROM conversations WHERE id IN ('${CONV1}','${CONV2}');`,
  `DELETE FROM posts WHERE id IN ('${Object.values(P).join("','")}');`,
  `DELETE FROM communities WHERE id IN ('${Object.values(C).join("','")}');`,
  `DELETE FROM users WHERE id IN ('${Object.values(U).join("','")}');`,
  ...userLines, "",
  ...communityLines, "",
  ...memberLines, "",
  ...postLines, "",
  ...commentLines, "",
  ...reactionLines, "",
  ...connLines, "",
  ...msgLines, "",
  ...notifLines, "",
  ...eventLines, "",
  ...oppLines, "",
  ...vaultLines, "",
  ...pollVoteLines, "",
  "COMMIT;",
];

console.log(lines.join("\n"));
