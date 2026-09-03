/**
 * Variables Configuration
 * =======================
 * 
 * CENTRAL PLACE TO DEFINE ALL SHARED VARIABLES
 * 
 * This file defines all variables that can be shared across sections.
 * AI agents should read this file to understand what variables are available.
 * 
 * USAGE:
 * 1. Define variables here with their default values and metadata
 * 2. Use them in any section with: const x = useVar('variableName', defaultValue)
 * 3. Update them with: setVar('variableName', newValue)
 */

import { type VarValue } from '@/stores';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
    /** Default value */
    defaultValue: VarValue;
    /** Human-readable label */
    label?: string;
    /** Description for AI agents */
    description?: string;
    /** Variable type hint */
    type?: 'number' | 'text' | 'boolean' | 'select' | 'array' | 'object' | 'spotColor' | 'linkedHighlight';
    /** Unit (e.g., 'Hz', '°', 'm/s') - for numbers */
    unit?: string;
    /** Minimum value (for number sliders) */
    min?: number;
    /** Maximum value (for number sliders) */
    max?: number;
    /** Step increment (for number sliders) */
    step?: number;
    /** Display color for InlineScrubbleNumber / InlineSpotColor (e.g. '#D81B60') */
    color?: string;
    /** Options for 'select' type variables */
    options?: string[];
    /** Placeholder text for text inputs */
    placeholder?: string;
    /**
     * Correct answer for cloze input validation.
     * Accepts a single string, pipe-separated alternates (e.g. "first | 1 | 1st"),
     * or an array of accepted answers (e.g. ["first", "1", "1st"]).
     */
    correctAnswer?: string | string[];
    /** Whether cloze matching is case sensitive */
    caseSensitive?: boolean;
    /** Background color for inline components */
    bgColor?: string;
    /** Schema hint for object types (for AI agents) */
    schema?: string;
}

/**
 * =====================================================
 * 🎯 DEFINE YOUR VARIABLES HERE
 * =====================================================
 * 
 * SUPPORTED TYPES:
 * 
 * 1. NUMBER (slider):
 *    { defaultValue: 5, type: 'number', min: 0, max: 10, step: 1 }
 * 
 * 2. TEXT (free text):
 *    { defaultValue: 'Hello', type: 'text', placeholder: 'Enter text...' }
 * 
 * 3. SELECT (dropdown):
 *    { defaultValue: 'sine', type: 'select', options: ['sine', 'cosine', 'tangent'] }
 * 
 * 4. BOOLEAN (toggle):
 *    { defaultValue: true, type: 'boolean' }
 * 
 * 5. ARRAY (list of numbers):
 *    { defaultValue: [1, 2, 3], type: 'array' }
 * 
 * 6. OBJECT (complex data):
 *    { defaultValue: { x: 5, y: 10 }, type: 'object', schema: '{ x: number, y: number }' }
 */
export const variableDefinitions: Record<string, VariableDefinition> = {
    // ========================================
    // ADD YOUR VARIABLES HERE
    // ========================================

    // ─────────────────────────────────────────
    // SHARED COLOUR IDENTITIES
    // Every quantity keeps ONE colour across figure, prose and formula:
    //   first die   soft violet  #AC8BF9
    //   second die  warm amber   #F7B23B
    //   favourable  soft teal    #62D0AD
    //   shaded      soft sky     #62CCF9
    //   all 36      ink          #475569
    // ─────────────────────────────────────────
    firstDieTerm: {
        defaultValue: 'first die',
        type: 'text',
        label: 'First die',
        description: 'Colour identity for the first die across prose, formulas and figures',
        color: '#AC8BF9',
    },
    secondDieTerm: {
        defaultValue: 'second die',
        type: 'text',
        label: 'Second die',
        description: 'Colour identity for the second die across prose, formulas and figures',
        color: '#F7B23B',
    },
    allOutcomesTerm: {
        defaultValue: 'sample space',
        type: 'text',
        label: 'Sample space S',
        description: 'Colour identity for the sample space S, the full set of 36 equally likely outcomes',
        color: '#475569',
    },
    eventTerm: {
        defaultValue: 'event',
        type: 'text',
        label: 'Event E',
        description: 'Colour identity for an event E, a subset of the sample space',
        color: '#62D0AD',
    },

    // ─────────────────────────────────────────
    // SECTION 2 — The Grid of All Outcomes
    // ─────────────────────────────────────────
    firstStageWays: {
        defaultValue: 4,
        type: 'number',
        label: 'Ways for the first thing',
        description: 'How many results the first object in a two-stage experiment can give',
        min: 1,
        max: 10,
        step: 1,
        color: '#AC8BF9',
    },
    secondStageWays: {
        defaultValue: 5,
        type: 'number',
        label: 'Ways for the second thing',
        description: 'How many results the second object in a two-stage experiment can give',
        min: 1,
        max: 10,
        step: 1,
        color: '#F7B23B',
    },
    stageOutcomes: {
        defaultValue: 20,
        type: 'number',
        label: 'Outcomes altogether',
        description: 'Derived product of firstStageWays and secondStageWays, read only',
        min: 1,
        max: 100,
        step: 1,
        color: '#62D0AD',
    },
    outcomeGuess: {
        defaultValue: 9,
        type: 'number',
        label: 'Guessed number of outcomes',
        description: "How many outcomes the student thinks two dice can produce",
        min: 1,
        max: 42,
        step: 1,
        color: '#62D0AD',
    },
    outcomeGridRevealed: {
        defaultValue: false,
        type: 'boolean',
        label: 'Outcome grid revealed',
        description: 'Whether the true set of 36 outcomes has been revealed',
    },
    outcomeGridHovered: {
        defaultValue: -1,
        type: 'number',
        label: 'Hovered outcome square',
        description: 'Index 0-35 of the outcome square under the pointer, or -1 for none',
        min: -1,
        max: 35,
        step: 1,
    },
    treeOpenBranch: {
        defaultValue: 1,
        type: 'number',
        label: 'Open tree branch',
        description: 'Which first-die branch of the tree is currently opened out (1 to 6)',
        min: 1,
        max: 6,
        step: 1,
        color: '#AC8BF9',
    },
    treeVisitedBranches: {
        defaultValue: 1,
        type: 'number',
        label: 'Visited tree branches',
        description: 'Bitmask of the first-die branches the student has already opened',
        min: 0,
        max: 63,
        step: 1,
    },
    outcomeGridHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Outcome grid highlight',
        description: 'Which part of the outcome grid the prose is pointing at',
        color: '#6366f1',
        bgColor: 'rgba(99, 102, 241, 0.15)',
    },
    // ─────────────────────────────────────────
    // SECTION 3 — Why Seven Wins
    // ─────────────────────────────────────────
    chosenTotal: {
        defaultValue: 2,
        type: 'number',
        label: 'Chosen total',
        description: 'The dice total whose squares are lit as a stripe across the grid',
        min: 2,
        max: 12,
        step: 1,
        color: '#62D0AD',
    },
    visitedTotals: {
        defaultValue: 1,
        type: 'number',
        label: 'Visited totals',
        description: 'Bitmask of which totals the student has already landed on (bit 0 is the total 2)',
        min: 0,
        max: 2047,
        step: 1,
    },
    waysForTotal: {
        defaultValue: 1,
        type: 'number',
        label: 'Ways for the chosen total',
        description: 'Derived count of the squares that make the chosen total, read only',
        min: 0,
        max: 6,
        step: 1,
        color: '#62D0AD',
    },
    outcomeGroupsTerm: {
        defaultValue: 'groups of outcomes',
        type: 'text',
        label: 'Groups of outcomes',
        description: 'Highlighted term for a total seen as a group of outcomes',
        color: '#F8A0CD',
    },
    sevenWinsHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Seven wins highlight',
        description: 'Which stripe of the totals grid the prose is pointing at',
        color: '#6366f1',
        bgColor: 'rgba(99, 102, 241, 0.15)',
    },
    answerWaysToFive: {
        defaultValue: '',
        type: 'text',
        label: 'Ways to make five',
        description: 'Student answer for how many outcomes give a total of five',
        correctAnswer: ['4', 'four'],
        placeholder: '???',
        color: '#6366f1',
    },
    answerSixOrEleven: {
        defaultValue: '',
        type: 'select',
        label: 'Six or eleven',
        description: 'Student answer comparing the likelihood of a total of six and a total of eleven',
        options: ['a total of six', 'a total of eleven', 'they are equally likely'],
        correctAnswer: 'a total of six',
        placeholder: '???',
        color: '#6366f1',
    },

    // ─────────────────────────────────────────
    // SECTION 4 — Reading Any Event off the Grid
    // ─────────────────────────────────────────
    targetProbability: {
        defaultValue: '1/3',
        type: 'select',
        label: 'Target probability',
        description: 'The probability the shaded squares are aiming to match',
        options: ['1/6', '1/4', '1/3', '1/2'],
        color: '#62D0AD',
        bgColor: 'rgba(98, 208, 173, 0.15)',
    },
    shadedMask: {
        defaultValue: '000000000000000000000000000000000000',
        type: 'text',
        label: 'Shaded squares',
        description: 'One character per outcome square, 1 when the student has shaded it',
    },
    shadedCount: {
        defaultValue: 0,
        type: 'number',
        label: 'Shaded square count',
        description: 'How many of the 36 outcome squares are currently shaded',
        min: 0,
        max: 36,
        step: 1,
        color: '#62CCF9',
    },
    eventGridHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Event grid highlight',
        description: 'Which event the prose is pointing at in the outcome grid',
        color: '#6366f1',
        bgColor: 'rgba(99, 102, 241, 0.15)',
    },
    answerBothEven: {
        defaultValue: '',
        type: 'text',
        label: 'Both dice even',
        description: 'Student answer for how many outcomes have both dice showing an even number',
        correctAnswer: ['9', 'nine'],
        placeholder: '???',
        color: '#6366f1',
    },
    answerDifferByTwo: {
        defaultValue: '',
        type: 'text',
        label: 'Faces differ by two',
        description: 'Student answer for how many outcomes have the two faces differing by exactly two',
        correctAnswer: ['8', 'eight'],
        placeholder: '???',
        color: '#6366f1',
    },

    formulaEvenOddCount: {
        defaultValue: '',
        type: 'select',
        label: 'Even then odd count',
        description: 'Numerator inside the formula for an even first roll and an odd second roll',
        options: ['6', '9', '12', '18'],
        correctAnswer: '9',
        placeholder: '??',
        color: '#62CCF9',
        bgColor: 'rgba(98, 204, 249, 0.15)',
    },
    formulaEvenOddFraction: {
        defaultValue: '',
        type: 'select',
        label: 'Even then odd probability',
        description: 'Simplified probability of an even first roll followed by an odd second roll',
        options: ['1/6', '1/4', '1/3', '1/2'],
        correctAnswer: '1/4',
        placeholder: '??',
        color: '#62D0AD',
        bgColor: 'rgba(98, 208, 173, 0.15)',
    },
    answerSwapEvenOdd: {
        defaultValue: '',
        type: 'select',
        label: 'Swapped even and odd',
        description: 'Student answer comparing odd-then-even with even-then-odd',
        options: ['exactly the same', 'smaller', 'larger'],
        correctAnswer: 'exactly the same',
        placeholder: '???',
        color: '#6366f1',
    },
    answerSwappedPair: {
        defaultValue: '',
        type: 'select',
        label: 'Swapped pair answer',
        description: 'Student answer on whether red 3 / blue 6 and red 6 / blue 3 are the same outcome',
        options: ['the same', 'different'],
        correctAnswer: 'different',
        placeholder: '???',
        color: '#6366f1',
    },
    answerCoinAndDie: {
        defaultValue: '',
        type: 'text',
        label: 'Coin and die outcome count',
        description: 'Student answer for the number of outcomes of a coin toss and a die roll',
        correctAnswer: ['12', 'twelve'],
        placeholder: '???',
        color: '#6366f1',
    },

    // Uncomment and modify these examples for your lesson:

    /*
    // ─────────────────────────────────────────
    // NUMBER - Use with sliders
    // ─────────────────────────────────────────
    myValue: {
        defaultValue: 5,
        type: 'number',
        label: 'My Value',
        description: 'A number that controls something',
        unit: 'm',           // optional unit display
        min: 0,
        max: 10,
        step: 0.5,
    },

    // ─────────────────────────────────────────
    // TEXT - Free text input
    // ─────────────────────────────────────────
    lessonTitle: {
        defaultValue: 'My Lesson',
        type: 'text',
        label: 'Lesson Title',
        description: 'The title of your lesson',
        placeholder: 'Enter a title...',
    },

    // ─────────────────────────────────────────
    // SELECT - Dropdown with options
    // ─────────────────────────────────────────
    difficulty: {
        defaultValue: 'medium',
        type: 'select',
        label: 'Difficulty',
        description: 'The difficulty level of the lesson',
        options: ['easy', 'medium', 'hard', 'expert'],
    },

    // ─────────────────────────────────────────
    // BOOLEAN - Toggle switch
    // ─────────────────────────────────────────
    showHints: {
        defaultValue: true,
        type: 'boolean',
        label: 'Show Hints',
        description: 'Toggle to show or hide hints',
    },

    // ─────────────────────────────────────────
    // ARRAY - List of numbers
    // ─────────────────────────────────────────
    dataPoints: {
        defaultValue: [1, 4, 9, 16, 25],
        type: 'array',
        label: 'Data Points',
        description: 'Y-values for plotting a graph',
    },

    // ─────────────────────────────────────────
    // OBJECT - Complex structured data
    // ─────────────────────────────────────────
    graphSettings: {
        defaultValue: { 
            xMin: -10, 
            xMax: 10, 
            showGrid: true 
        },
        type: 'object',
        label: 'Graph Settings',
        description: 'Configuration for the graph display',
        schema: '{ xMin: number, xMax: number, showGrid: boolean }',
    },
    */
};

/**
 * Get all variable names (for AI agents to discover)
 */
export const getVariableNames = (): string[] => {
    return Object.keys(variableDefinitions);
};

/**
 * Get a variable's default value
 */
export const getDefaultValue = (name: string): VarValue => {
    return variableDefinitions[name]?.defaultValue ?? 0;
};

/**
 * Get a variable's metadata
 */
export const getVariableInfo = (name: string): VariableDefinition | undefined => {
    return variableDefinitions[name];
};

/**
 * Get all default values as a record (for initialization)
 */
export const getDefaultValues = (): Record<string, VarValue> => {
    const defaults: Record<string, VarValue> = {};
    for (const [name, def] of Object.entries(variableDefinitions)) {
        defaults[name] = def.defaultValue;
    }
    return defaults;
};

/**
 * Get number props for InlineScrubbleNumber from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
export function numberPropsFromDefinition(def: VariableDefinition | undefined): {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
} {
    if (!def || def.type !== 'number') return {};
    return {
        defaultValue: def.defaultValue as number,
        min: def.min,
        max: def.max,
        step: def.step,
        ...(def.color ? { color: def.color } : {}),
    };
}

/**
 * Get cloze input props for InlineClozeInput from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
/**
 * Get cloze choice props for InlineClozeChoice from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function choicePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Get toggle props for InlineToggle from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function togglePropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

export function clozePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
    caseSensitive?: boolean;
} {
    if (!def || def.type !== 'text') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
        ...(def.caseSensitive !== undefined ? { caseSensitive: def.caseSensitive } : {}),
    };
}

/**
 * Get spot-color props for InlineSpotColor from a variable definition.
 * Extracts the `color` field.
 *
 * @example
 * <InlineSpotColor
 *     varName="radius"
 *     {...spotColorPropsFromDefinition(getVariableInfo('radius'))}
 * >
 *     radius
 * </InlineSpotColor>
 */
export function spotColorPropsFromDefinition(def: VariableDefinition | undefined): {
    color: string;
} {
    return {
        color: def?.color ?? '#8B5CF6',
    };
}

/**
 * Get linked-highlight props for InlineLinkedHighlight from a variable definition.
 * Extracts the `color` and `bgColor` fields.
 *
 * @example
 * <InlineLinkedHighlight
 *     varName="activeHighlight"
 *     highlightId="radius"
 *     {...linkedHighlightPropsFromDefinition(getVariableInfo('activeHighlight'))}
 * >
 *     radius
 * </InlineLinkedHighlight>
 */
export function linkedHighlightPropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    return {
        ...(def?.color ? { color: def.color } : {}),
        ...(def?.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Build the `variables` prop for FormulaBlock from variable definitions.
 *
 * Takes an array of variable names and returns the config map expected by
 * `<FormulaBlock variables={...} />`.
 *
 * @example
 * import { scrubVarsFromDefinitions } from './variables';
 *
 * <FormulaBlock
 *     latex="\scrub{mass} \times \scrub{accel}"
 *     variables={scrubVarsFromDefinitions(['mass', 'accel'])}
 * />
 */
export function scrubVarsFromDefinitions(
    varNames: string[],
): Record<string, { min?: number; max?: number; step?: number; color?: string }> {
    const result: Record<string, { min?: number; max?: number; step?: number; color?: string }> = {};
    for (const name of varNames) {
        const def = variableDefinitions[name];
        if (!def) continue;
        result[name] = {
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            ...(def.step !== undefined ? { step: def.step } : {}),
            ...(def.color ? { color: def.color } : {}),
        };
    }
    return result;
}
