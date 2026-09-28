// Editorial guides (Layer 3 — see Founding Plan §5 "Editorial, dashboard &
// data"). These are independent and never rank or recommend a specific
// school — that would break the neutrality the whole site is built on. A
// guide's job is to help a parent think clearly, then hand them off to the
// directory (curriculum hubs, city hubs, compare, shortlist) to do the
// actual comparing themselves.
//
// No guide states a specific fee figure. Fees only appear on a school's own
// page once a school or parent has verified them (see the tuition-stripping
// note in lib/schools.js) — a guide repeating an unverified number would be
// exactly the kind of guess this site exists to avoid.
//
// sections[] block types, rendered by app/components/ArticleBody.js:
//   { type: 'p',  text }         — paragraph
//   { type: 'h2', text }         — section heading
//   { type: 'h3', text }         — sub-heading
//   { type: 'ul', items: [...] } — bullet list
//   { type: 'note', text }       — callout box (site .note styling)
//   { type: 'board-links' }      — live links to every curriculum hub, with
//                                   a current school count pulled from
//                                   lib/schools.js at request time
//   { type: 'city-links' }       — same, for city hubs

export const GUIDES = [
  {
    slug: 'ib-vs-igcse-vs-cbse-vs-a-level',
    title: 'IB vs IGCSE vs CBSE vs A-Level: how to choose the right curriculum in India',
    description:
      "What each board actually optimises for, who tends to do well in each, and the questions that matter more than the name on the prospectus.",
    category: 'Choosing a curriculum',
    updated: '2026-09-28',
    sections: [
      {
        type: 'p',
        text:
          "Most curriculum decisions get made backwards: a family picks a school first, for reasons that have nothing to do with the board, and only afterwards asks whether CBSE, ICSE, IGCSE, IB or A-Level was the right fit. That order is understandable — schools, not boards, are what you can visit — but it's worth spending twenty minutes on the boards themselves before you tour a single campus. The differences are real, and some of them are hard to undo once your child is two years into a programme.",
      },
      { type: 'h2', text: 'What each system actually is' },
      {
        type: 'p',
        text:
          "CBSE (Central Board of Secondary Education) is India's largest school board, following an NCERT syllabus with board exams at Class 10 and Class 12. It's the default path into JEE, NEET and most Indian competitive exams, because the syllabus overlaps heavily with what those exams test. If your child is likely to sit Indian entrance exams, CBSE removes a layer of translation between what's taught and what's tested.",
      },
      {
        type: 'p',
        text:
          "ICSE, and its senior counterpart ISC, are run by the Council for the Indian School Certificate Examinations. The syllabus is broader than CBSE's in the humanities and English, and is generally considered to demand more from students across a wider spread of subjects rather than concentrating effort narrowly. It's still an Indian board, still leads to Class 10 and 12 board exams, and still works fine for Indian competitive exams — just with a bit more breadth along the way.",
      },
      {
        type: 'p',
        text:
          "IGCSE (International General Certificate of Secondary Education — run by Cambridge International or Pearson Edexcel) is typically taken at Class 10, sometimes spread across Classes 9 and 10. It's internationally benchmarked rather than India-specific, assessed subject by subject rather than as one combined qualification, and is very commonly used as a two-year on-ramp into the IB Diploma or A-Levels for Classes 11–12 — few schools stop at IGCSE alone.",
      },
      {
        type: 'p',
        text:
          "The IB (International Baccalaureate) runs three programmes: the Primary Years Programme (PYP, roughly ages 3–12), the Middle Years Programme (MYP, roughly 11–16) and the Diploma Programme (DP, Classes 11–12). The Diploma is the one most parents mean when they say \"IB\" — six subject groups, plus a research-based Extended Essay, a Theory of Knowledge course, and a Creativity-Activity-Service component outside the classroom, scored out of 45 points. It's inquiry-based rather than exam-drilled, deliberately broad across sciences, humanities, languages and the arts, and it's recognised by universities worldwide.",
      },
      {
        type: 'p',
        text:
          "A-Levels (Cambridge International or Edexcel), also Classes 11–12, go the opposite direction from the IB: a student picks three or four subjects and studies them in real depth, with no requirement to keep up maths, a second language or the arts if they've already decided on a direction. It's the traditional route into UK universities in particular, and rewards a student who already knows roughly what they want to specialise in.",
      },
      { type: 'h2', text: 'Breadth vs depth: the trade-off underneath all of this' },
      {
        type: 'p',
        text:
          "Strip away the acronyms and most of the decision comes down to one axis: how early should a child specialise? CBSE and ICSE keep a wide, common syllabus all the way to Class 12. IGCSE keeps things wide through Class 10, then most schools narrow via IB or A-Level after that. The IB Diploma keeps breadth deliberately alive even at Classes 11–12 — a science-track student is still writing essays and doing a creative or service component. A-Levels let a student go narrow and deep two years earlier than almost any other option here.",
      },
      {
        type: 'p',
        text:
          "Neither end of that axis is objectively better. A child who already knows they want to study engineering and finds humanities a chore may thrive under A-Levels' focus, or under CBSE/JEE-aligned prep. A child who hasn't decided yet, or who does genuinely well across very different kinds of subjects, tends to be better served by IGCSE→IB or by ICSE's broader spread. Be honest about which description fits your child today, not which one you'd like to fit in five years.",
      },
      { type: 'h2', text: 'If a move abroad — or another Indian city — is on the horizon' },
      {
        type: 'p',
        text:
          "This is where the board choice stops being academic and starts being logistical. CBSE and ICSE transfer smoothly between Indian cities — most CBSE or ICSE schools teach to the same national syllabus, so a mid-year move is disruptive but not a curriculum change. IGCSE and IB, being run by international bodies rather than a single national syllabus-setter, tend to transfer more smoothly across countries — an IB school in Dubai and an IB school in Bangalore are following recognisably the same programme, which is not true of two schools on two different national boards.",
      },
      {
        type: 'note',
        text:
          "If you're moving countries specifically, treat this as the single most important filter, ahead of reputation or facilities. A school that scores well on everything else but forces a curriculum change mid-way through a board cycle (say, in the middle of IGCSE Class 10, or the first year of an IB Diploma) can cost your child a year of continuity that's hard to get back.",
      },
      { type: 'h2', text: 'If the destination is a university abroad' },
      {
        type: 'p',
        text:
          "All four systems are accepted by universities internationally — this isn't a case of one being \"recognised\" and the others not. What differs is fit and familiarity. UK universities are most used to reading A-Level and IB transcripts, since those are the two qualifications most of their applicant pool arrives with. US admissions officers are broadly comfortable with all four, and IB in particular is well understood there because of its Extended Essay and TOK components, which map naturally onto the kind of independent research US colleges like to see. If US applications are the goal, IB's breadth requirement (keeping some science, some humanities, a language) can also just be a more natural fit than A-Level's early narrowing, since most US degrees don't ask a 17-year-old to have already picked a lane.",
      },
      { type: 'h2', text: "If you genuinely don't know yet" },
      {
        type: 'p',
        text:
          "That's a normal place to be, and it's also an argument for a specific, practical choice: pick a school that offers IGCSE through to Class 10 and decides between IB and A-Level afterwards, rather than one that locks a track in earlier. It costs you nothing to delay the depth-vs-breadth decision by two years, and a 15-year-old is simply better positioned to make it than a parent enrolling a 10-year-old.",
      },
      { type: 'h2', text: "Questions worth asking that matter more than the board's name" },
      {
        type: 'ul',
        items: [
          "How many years has this specific school been running this board, and how many cohorts have actually graduated from it? A school in its first IB cohort is a different proposition from one with fifteen years of DP results.",
          "What happens if we need to move mid-cycle — does the school have a documented process for transfers in or out, or would we be the first family to try it?",
          "For IGCSE/IB/A-Level schools: which exam board specifically (Cambridge vs Edexcel, for IGCSE and A-Level), and does that match what other schools in the cities we might move to also offer?",
          "For CBSE/ICSE schools: how much of the timetable, realistically, is oriented toward competitive-exam coaching versus the board syllabus itself, if JEE/NEET prep matters to you?",
          "What does the school actually mean by \"IB\" or \"international curriculum\" in its marketing — full authorisation for PYP/MYP/DP, or just DP for the senior years bolted onto something else underneath?",
        ],
      },
      { type: 'h2', text: 'Where to go from here' },
      {
        type: 'p',
        text:
          "Curriculum is one filter among several — city, budget range, and a school's own track record with that specific board all matter as much as which acronym is on the letterhead. The fastest way to see who actually teaches what near you is to browse by curriculum directly:",
      },
      { type: 'board-links' },
      {
        type: 'p',
        text:
          "From there, use compare on two or three schools that teach the same board before you book a single tour — it's the fastest way to see how differently two schools can deliver an identical curriculum.",
      },
    ],
  },

  {
    slug: 'nri-guide-choosing-a-school-in-india',
    title: "Moving to India: an NRI parent's guide to choosing an international school",
    description:
      "A timeline, a curriculum-continuity checklist, and the questions relocating families forget to ask until it's too late to ask them.",
    category: 'Relocating to India',
    updated: '2026-09-28',
    sections: [
      {
        type: 'p',
        text:
          "Choosing a school from another country is a different problem from choosing one down the street. You can't casually drive past a campus on a Tuesday afternoon, you're working against a school calendar you may only half-remember, and the cost of guessing wrong is a mid-year disruption to your child's schooling on top of everything else a relocation already throws at a family. None of that is solved by finding the \"best\" school in a city — it's solved by narrowing the field methodically, earlier than feels necessary.",
      },
      { type: 'h2', text: 'Start earlier than you think' },
      {
        type: 'p',
        text:
          "The admissions calendar for the flagship international schools in cities like Bangalore, Delhi NCR and Mumbai runs well ahead of the general market — waitlists at the most established IB and IGCSE schools can fill for an academic year eight to twelve months out, especially at popular grade levels. If your move date is fixed, work backwards from it: shortlist while you're still abroad, request document lists early, and treat \"we'll sort the school once we land\" as a plan that only works if you're flexible on which school, which is often not the case for families who've researched carefully.",
      },
      { type: 'h2', text: 'Decide curriculum continuity before you decide on a city' },
      {
        type: 'p',
        text:
          "If your child is already partway through a curriculum abroad — an IB Middle Years Programme, an American high-school system, a UK national curriculum — the single highest-leverage decision is finding a school in India that continues it, rather than one that's simply well regarded. A strong CBSE school is not a safe landing spot for a child halfway through IB MYP; the syllabus, assessment style and pacing are different enough that continuity, not prestige, should be the first filter. See our curriculum comparison guide for how the major Indian and international boards actually differ, and use it to work out which continuation options genuinely exist before you fall in love with a campus that doesn't offer one.",
      },
      { type: 'h2', text: 'City matters more than most relocation guides admit' },
      {
        type: 'p',
        text:
          "International-curriculum schools are not evenly spread across India — they cluster heavily around a handful of cities, and depth within a city (multiple established options at your child's grade level, in the curriculum you need) matters more than a city's overall reputation as an NRI destination. Before you commit to a neighbourhood, check which cities actually have the school density you'll want as a backup if your first choice doesn't work out:",
      },
      { type: 'city-links' },
      { type: 'h2', text: "What to have ready before you're comparing schools seriously" },
      {
        type: 'ul',
        items: [
          "Transcripts and report cards from the current school, ideally translated or at least explained (grading scales vary enormously between countries and a raw transcript often needs context).",
          "A transfer certificate or leaving certificate — most Indian schools will ask for one, and getting it from a school abroad after you've already left can take far longer than expected.",
          "Any special-education, learning-support or medical documentation your child currently has an IEP or accommodation plan around — ask each shortlisted school directly and early whether they can continue that support, rather than assuming an \"international\" label implies it.",
          "Clarity on visa/OCI status for the child, since some schools ask for this as part of admission paperwork — the school's admissions office, not a general relocation agent, is the right source for what they specifically require.",
        ],
      },
      { type: 'h2', text: 'Questions specific to relocating families' },
      {
        type: 'ul',
        items: [
          "Does the school accept admissions mid-year, or only at the start of the academic year in April/June? Many strong schools genuinely don't, and finding this out after arriving is a costly surprise.",
          "What ESL or language-transition support exists if your child hasn't studied in English before, or hasn't studied Hindi/a regional language and the school expects it as a second language?",
          "Is there a boarding or extended-day option if one parent is still relocating or travelling frequently in the first year?",
          "How does the school handle a student arriving partway through a two-year exam cycle (IGCSE Year 1, IB Diploma Year 1) — is a mid-cycle transfer something they've actually done, or something they'd be attempting with you?",
        ],
      },
      { type: 'h2', text: 'On fees, plainly' },
      {
        type: 'p',
        text:
          "We don't publish a fee figure on a school's page until that school or a parent has verified it — a guessed number is worse than no number, especially for a decision made from thousands of kilometres away. What we'd say instead: request a full, itemised fee structure in writing from every shortlisted school before you commit — tuition alone is rarely the whole cost, and admission/registration fees, refundable deposits, transport, and one-time \"development\" charges vary far more between schools than tuition does. Ask specifically what happens to fees already paid if your posting changes and you need to withdraw your child — refund policies differ a lot and are worth knowing before, not after.",
      },
      { type: 'h2', text: 'Where to go from here' },
      {
        type: 'p',
        text:
          "Once you've narrowed to a city and a curriculum, use compare to sit two or three verified schools side by side, and sign in to save a shortlist so you're not re-researching from scratch every time a new option comes up mid-search.",
      },
    ],
  },

  {
    slug: 'evaluate-a-school-beyond-the-brochure',
    title: 'How to evaluate an international school beyond the brochure',
    description:
      "A brochure is marketing, not evidence. A practical, parameter-by-parameter checklist for the tour and the conversation that follows it.",
    category: 'Evaluating a school',
    updated: '2026-09-28',
    sections: [
      {
        type: 'p',
        text:
          "Every international school's brochure says roughly the same things: holistic development, world-class facilities, individual attention, a caring community. None of that is false, exactly, but none of it is falsifiable either — there's no version of a school prospectus that describes itself as mediocre. The brochure's job is to get you to visit. Your job on the visit is to ask questions that have a specific, checkable answer instead of a feeling attached to them.",
      },
      { type: 'h2', text: "What a tour actually tells you — and what it doesn't" },
      {
        type: 'p',
        text:
          "A campus tour is real evidence of facilities and physical upkeep, and a reasonable read on how staff talk to students when they think no one important is watching. It tells you almost nothing about teaching quality, how the school handles a struggling student, how fees actually work once you're enrolled, or what parents who left the school would say. Those require different sources: current or former parents, the fee agreement itself, and specific questions to the admissions team that a glossy answer can't easily dodge.",
      },
      { type: 'h2', text: 'A parameter-by-parameter checklist' },
      { type: 'h3', text: '1. Academics and curriculum fit' },
      {
        type: 'p',
        text:
          "Not just which board, but how long the school has run it and how many cohorts have completed it end to end. Ask for the last two or three years of board-exam or DP-score outcomes if the school is willing to share them, and ask how those compare with the national average for that board — a specific number is worth more than \"our results are excellent.\"",
      },
      { type: 'h3', text: '2. Teachers and class size' },
      {
        type: 'p',
        text:
          "Ask actual student-to-teacher ratios by grade, not a school-wide average that can hide a crowded senior-secondary class behind a spacious kindergarten. Ask about teacher turnover — a school that loses a large share of its teaching staff every year is telling you something, even if it never says it directly.",
      },
      { type: 'h3', text: '3. Facilities and safety' },
      {
        type: 'p',
        text:
          "Beyond what's visible on a tour: ask about the student-support or counselling setup, the process for a medical emergency, transport safety measures if your child will use the school bus, and — for younger children specifically — the ratio and visibility of staff during unstructured time, not just class time.",
      },
      { type: 'h3', text: '4. Fees, in full, in writing' },
      {
        type: 'p',
        text:
          "Ask for every fee head itemised — tuition, admission, refundable deposit, transport, uniforms, activity fees, any \"development\" or infrastructure charge — before you pay anything. Ask specifically about the annual increase policy (many schools raise fees yearly by a fixed percentage or board decision) and the refund policy if you withdraw partway through a year. A school that's slow or vague about putting this in writing is worth noting for that alone.",
      },
      { type: 'h3', text: '5. Culture and values fit' },
      {
        type: 'p',
        text:
          "This is the most subjective parameter and also a real one — a school's disciplinary philosophy, religious or values orientation, and general tone (competitive vs collaborative, structured vs flexible) genuinely varies and genuinely matters for whether your specific child will be happy there. Talk to current parents if you can find any, not just the ones the school introduces you to.",
      },
      { type: 'h3', text: '6. Outcomes beyond exam results' },
      {
        type: 'p',
        text:
          "Where do graduating students actually go — university placements, if relevant to your goals, but also the breadth of extracurricular and leadership opportunities that shaped how they got there. Ask for specifics rather than a general claim: named universities from the last two graduating batches, not \"our students get into top universities.\"",
      },
      { type: 'h3', text: '7. Logistics that quietly determine daily life' },
      {
        type: 'p',
        text:
          "Commute time and transport reliability, school hours and after-school-care options if both parents work, and how the school communicates day to day (a responsive parent portal vs an occasional newsletter) all affect your family's daily life far more than most brochure copy does.",
      },
      { type: 'h2', text: 'A note on reviews, including ours' },
      {
        type: 'p',
        text:
          "Parent reviews are valuable and also gameable — a small, high-stakes community makes it easy for a school to mobilise a handful of happy parents to post glowing reviews, while a genuinely dissatisfied parent has every incentive to be loud. Treat any review platform, including this one, more carefully where reviews aren't clearly tied to a verified parent at that specific school, and weight a pattern across many reviews well above any single account, glowing or scathing.",
      },
      { type: 'h2', text: 'Where to go from here' },
      {
        type: 'p',
        text:
          "Bring this checklist to a tour rather than trying to remember it, compare two or three schools side by side using the same seven questions on each, and save the ones that hold up to a shortlist so you can revisit them once you've done the same exercise elsewhere.",
      },
    ],
  },
];

export function getAllGuides() {
  return GUIDES;
}

export function getGuideBySlug(slug) {
  return GUIDES.find((g) => g.slug === slug) || null;
}
