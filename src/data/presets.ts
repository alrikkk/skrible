import { PresetSample } from "../types";

export const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "ochem-whiteboard",
    title: "Organic Chem SN2 Whiteboard",
    subtitle: "Messy lecture scribbles on nucleophilic substitution",
    icon: "🧪",
    category: "Note Engine",
    route: "notes",
    prompt: `Prof spent 45 min on SN2 mechanisms. 
Primary alkyl halide reacts with strong nucleophile like OH- in bimolecular transition state. 
Inversion of stereochemistry occurs (Walden inversion). 
Polar aprotic solvents like DMSO or acetone favor SN2 because they don't solvate nucleophiles tightly. 
Rate = k[substrate][nucleophile]. Steric hindrance slows it down drastically. Tertiary halides DO NOT undergo SN2!`,
  },
  {
    id: "fridge-dorm-chef",
    title: "Messy Dorm Fridge + $12",
    subtitle: "3 eggs, half onion, old cheddar, stale tortilla",
    icon: "🍳",
    category: "Dorm Chef",
    route: "chef",
    budget: "12.00",
    prompt: `I have 3 eggs, half a yellow onion, a block of sharp cheddar, 2 stale flour tortillas, and half a jar of salsa. I also have $12 leftover in my dorm meal card. Need a quick breakfast burrito meal prep under 15 min!`,
  },
  {
    id: "econ-voice-note",
    title: "Econ 101 Lecture Voice Memo",
    subtitle: "Transcript on market supply & demand curves",
    icon: "🎙️",
    category: "Note Engine",
    route: "notes",
    prompt: `Voice transcript: "Okay so remember for the midterm guys: a shift in the demand curve is caused by non-price factors like buyer income, preferences, or price of substitutes. A movement ALONG the demand curve is ONLY caused by a change in the good's own price. Supply curves slope upward due to increasing marginal opportunity cost. Equilibrium is where quantity demanded equals quantity supplied. Price ceilings cause shortages, price floors cause surpluses."`,
  },
  {
    id: "target-receipt",
    title: "Pantry Staples + Receipt",
    subtitle: "Ramen, peanut butter, oats & eggs scan",
    icon: "🧾",
    category: "Dorm Chef",
    route: "chef",
    budget: "15.00",
    prompt: `Scanned receipt items: Instant Ramen ($2.50), Rolled Oats ($3.20), Creamy Peanut Butter ($3.80), Dozen Eggs ($2.99), Bananas ($1.50). Total spent: $13.99. Remaining budget: $1.01. Give me a high-protein breakfast or snack recipe!`,
  },
  {
    id: "thermo-notes",
    title: "Thermodynamics Cram Sheet",
    subtitle: "Entropy, Enthalpy & Gibbs Free Energy",
    icon: "⚡️",
    category: "Note Engine",
    route: "notes",
    prompt: `Chaotic study notes: Delta G = Delta H - T * Delta S. If Delta G is negative, process is spontaneous (exergonic). 2nd law of thermodynamics says entropy S of universe always increases for spontaneous processes. Enthalpy Delta H is heat content. Endothermic (Delta H > 0) vs Exothermic (Delta H < 0). Standard state is 25 deg C and 1 atm pressure.`,
  }
];
