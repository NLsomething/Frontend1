 //Regular quotes (10) - 90.9% chance each
 //Easter eggs (3) - 3% each


const REGULAR_QUOTES = [
  "Students can finally find available rooms and check schedules without the headache... if they have a laptop with them",
  "Teachers can book rooms in seconds instead of sending a dozen emails back and forth... please no more last minute emails!",
  "Built with React and Vite super fast, really smooth.",
  "Three.js makes our buildings look amazing in 3D, and 'totally' lag free!",
  "Managers can actually control their buildings without moving to check every hour",
  "Everyone sees real-time room updates. No more 'is this room actually free?'",
  "Zustand keeps things running smooth even when data gets complicated.",
  "Supabase powers the backend so we don't have to worry about that stuff.",
  "Turns classroom scheduling chaos into something that actually makes sense.",
  "Works on your laptop and desktop wherever you are."
]

const EASTER_EGGS = [
  "'You're absolutely right!' — Claude in Copilot",
  "This codebase was crafted through vibe coding sessions while aggressively avoiding AI slop. Clean vibes only.",
  "Check out rickroll.com, it's a really great site!"
]

/**
 * Get a random quote with weighted probability
 * 90.9% chance: regular quote
 * 9.1% chance: easter egg
 * 
 * @returns {string} A random quote
 */
export const getRandomQuote = () => {
  const totalChoices = 11
  const randomChoice = Math.floor(Math.random() * totalChoices)
  
  if (randomChoice === 10) {
    const easterEggIndex = Math.floor(Math.random() * EASTER_EGGS.length)
    return EASTER_EGGS[easterEggIndex]
  }
  
  return REGULAR_QUOTES[randomChoice]
}


export const getAllQuotes = () => ({
  regular: REGULAR_QUOTES,
  easterEggs: EASTER_EGGS
})

export const getQuoteStats = () => ({
  totalRegular: REGULAR_QUOTES.length,
  totalEasterEggs: EASTER_EGGS.length,
  regularChancePercent: (REGULAR_QUOTES.length / 11 * 100).toFixed(1),
  easterEggChancePercent: (1 / 11 * 100).toFixed(1),
  eachEasterEggChancePercent: (1 / 11 / EASTER_EGGS.length * 100).toFixed(2)
})
