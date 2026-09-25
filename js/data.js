const WORDS_EASY = "the and for are but not you all can her was one our out day get has him his how man new now old see two way who boy did let put say she too use dad mom cat dog run sun red big hot yes no go up on in at to of it is be we me my".split(" ");
const WORDS_MID = "castle mushroom princess plumber castle coin pipe cloud castle world quest speed accuracy keyboard practice kingdom castle puzzle logic emotion resilience creativity social focus rhythm pattern sequence analog reason choose better harder faster clearer".split(" ");
const WORDS_HARD = "quotient intelligence adversity resilience punctuation; challenge: type-speed, accuracy! Q-Kingdom requires discipline. Follow @MuazXinthi before you enter the castle. Super-Mario bricks, pipes & flags mark every cleared stage.".split(" ");

function seeded(n) {
  let x = (n * 9301 + 49297) % 233280;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function makePassage(level) {
  const rng = seeded(level * 17 + 3);
  const count = 12 + Math.floor(level * 0.55);
  let pool = WORDS_EASY;
  if (level > 25) pool = pool.concat(WORDS_MID);
  if (level > 55) pool = pool.concat(WORDS_HARD);
  const out = [];
  for (let i = 0; i < count; i++) out.push(pool[Math.floor(rng() * pool.length)]);
  let text = out.join(" ");
  if (level > 40 && level % 4 === 0) text += ".";
  if (level > 70 && level % 5 === 0) text += " Ready?";
  if (level >= 90) text += " Final stretch: stay accurate.";
  return text;
}

function typingTarget(level) {
  return {
    wpm: Math.round(22 + level * 0.68),
    acc: Math.min(98, Math.round(86 + level * 0.12)),
    livesCost: level > 80 ? 2 : 1
  };
}

const QUIZZES = {
  IQ: [
    { q: "What comes next? 2, 4, 8, 16, ?", a: ["18", "24", "32", "30"], c: 2 },
    { q: "Odd one out: Sparrow, Eagle, Bat, Penguin", a: ["Sparrow", "Eagle", "Bat", "Penguin"], c: 2 },
    { q: "If all zips are zaps and some zaps are zops, which MUST be true?", a: ["All zips are zops", "Some zips might be zops", "No zips are zops", "All zops are zips"], c: 1 },
    { q: "Find the analogy: Brick is to wall as pixel is to…", a: ["paint", "image", "camera", "color only"], c: 1 },
    { q: "A pipe is 12m. You climb 3m and slip 1m each hour. Hours to the top?", a: ["4", "5", "6", "12"], c: 2 },
    { q: "Which number is the square of 13?", a: ["156", "169", "171", "183"], c: 1 },
    { q: "Complete: 1, 1, 2, 3, 5, 8, ?", a: ["10", "11", "13", "15"], c: 2 },
    { q: "If WORLD is coded as XPSME, PIPE is coded as…", a: ["QJQF", "OJOD", "QHOF", "RJRG"], c: 0 },
    { q: "A cube has how many edges?", a: ["6", "8", "12", "16"], c: 2 },
    { q: "Which is a prime?", a: ["21", "27", "29", "33"], c: 2 },
    { q: "Mirror of 3:15 on a clock is closest to…", a: ["8:45", "9:15", "8:55", "7:45"], c: 0 },
    { q: "If 5 machines make 5 coins in 5 minutes, 100 machines make 100 coins in…", a: ["100 min", "20 min", "5 min", "1 min"], c: 2 }
  ],
  EQ: [
    { q: "A teammate snaps after a failed run. Best first move?", a: ["Snap back so they learn", "Give space, then ask what they need", "Ignore them forever", "Announce their failure in chat"], c: 1 },
    { q: "You feel rage mid-game. Healthiest reset?", a: ["Blame the keyboard", "Name the feeling, take 3 breaths, continue", "Quit and insult the quiz", "Pretend you feel nothing"], c: 1 },
    { q: "A friend is quiet after bad news. You…", a: ["Force jokes immediately", "Say you're here and listen", "Tell them to get over it", "Change the subject to you"], c: 1 },
    { q: "Someone credits your idea as theirs. EQ response?", a: ["Publicly explode", "Calmly reclaim the idea with facts", "Steal theirs next time", "Say nothing and stew"], c: 1 },
    { q: "You won a level. Friend lost. Kind move?", a: ["Flex hard", "Celebrate briefly, then help them retry", "Hide the win forever", "Delete the friend"], c: 1 },
    { q: "Feedback stings. High EQ habit?", a: ["Reject all of it", "Separate ego from useful signal", "Attack the giver", "Quit the kingdom"], c: 1 },
    { q: "Group chat turns toxic. You…", a: ["Add more heat", "De-escalate and set a boundary", "Dox people", "Ghost without a word ever"], c: 1 },
    { q: "You misread a tone. Next step?", a: ["Double down", "Own the miss and clarify", "Rewrite history", "Block them"], c: 1 }
  ],
  SQ: [
    { q: "You join a party already mid-plan. Socially sharp move?", a: ["Hijack the plan", "Ask where you can help", "Stay silent the whole time", "Talk only about yourself"], c: 1 },
    { q: "Two friends argue. Best role?", a: ["Pick a side instantly for drama", "Slow it down and seek shared goal", "Record it", "Leave and gossip"], c: 1 },
    { q: "Someone new stands alone at the castle gate.", a: ["Ignore them", "Invite them in with one clear cue", "Test them with a roast", "Make them prove loyalty first"], c: 1 },
    { q: "You need a favor. Good social form?", a: ["Demand it", "Ask clearly, accept no, offer value back", "Guilt them", "Publicly pressure"], c: 1 },
    { q: "A joke landed badly. You…", a: ["Repeat it louder", "Acknowledge and stop", "Blame their humor", "Make three more"], c: 1 },
    { q: "Online, someone is wrong. High SQ?", a: ["Ratio them", "Correct the idea, not the person's worth", "Quote-dunk", "Pile on"], c: 1 }
  ],
  AQ: [
    { q: "You fail Type Level 40 twice. AQ move?", a: ["Rage-quit the account", "Cut speed, raise accuracy, retry", "Cheat the timer", "Blame the font"], c: 1 },
    { q: "Progress wipes on one browser. You…", a: ["Quit forever", "Rebuild from World 1 with notes", "Accuse the internet", "Only play if guaranteed wins"], c: 1 },
    { q: "Hard quiz streak of misses means…", a: ["You are finished", "The skill is trainable under load", "Luck is gone", "Skip all tests"], c: 1 },
    { q: "A goal will take 100 small clears. AQ framing?", a: ["If not instant, it's worthless", "One pipe at a time", "Wait for motivation", "Do 100 tonight or nothing"], c: 1 },
    { q: "You freeze on a hard passage. Next 10 seconds?", a: ["Panic-mash keys", "Breathe, restart the line clean", "Close the tab", "Type random letters"], c: 1 },
    { q: "After a public miss, resilient posture is…", a: ["Hide", "Extract one lesson, play again", "Rewrite the story as a win", "Attack critics"], c: 1 }
  ],
  CQ: [
    { q: "A pipe is blocked. Most creative useful move?", a: ["Stare until it opens", "Use a nearby mechanic in a new way", "Quit the world", "Copy yesterday exactly"], c: 1 },
    { q: "You must explain this game in one image. Best idea?", a: ["A spreadsheet", "A flag on a brick castle made of letters", "A legal contract", "A blank page"], c: 1 },
    { q: "Divergent thinking means…", a: ["One official answer only", "Many possible routes, then pick a strong one", "Never decide", "Ignore constraints"], c: 1 },
    { q: "Combine Mario bricks + RuneScape skills. Fresh result?", a: ["Just another leaderboard", "A world map where stats are trained like skills", "A tax form", "A random chatroom"], c: 1 },
    { q: "Constraint: only 8-bit sounds. Creative response?", a: ["Give up audio", "Turn blips into a reward language", "Play a podcast over it", "Silence is the only art"], c: 1 },
    { q: "Best seed for a new mini-game here?", a: ["Copy typing again", "A pattern that mutates with your worst skill", "A slot machine", "Endless ads"], c: 1 }
  ]
};

const KINGDOMS = [
  { id: "TYPE", name: "TYPE KINGDOM", desc: "100 pipes. Hit the WPM + accuracy flag on each stage.", need: null, color: "#3cb818" },
  { id: "IQ", name: "IQ CASTLE", desc: "Patterns, numbers, logic. Unlock after Type 20.", need: 20, color: "#049cd8" },
  { id: "EQ", name: "EQ FOREST", desc: "Feelings under fire. Unlock after Type 30.", need: 30, color: "#e52521" },
  { id: "SQ", name: "SQ VILLAGE", desc: "People, rooms, timing. Unlock after Type 40.", need: 40, color: "#f8d020" },
  { id: "AQ", name: "AQ VOLCANO", desc: "Stay in when it hurts. Unlock after Type 50.", need: 50, color: "#c84c0c" },
  { id: "CQ", name: "CQ CLOUDS", desc: "Weird useful ideas. Unlock after Type 60.", need: 60, color: "#ffffff" }
];
