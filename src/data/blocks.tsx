import { type ReactElement } from "react";

// Initialize variables and their colors from this file's variable definitions
import { useVariableStore, initializeVariableColors } from "@/stores";
import { getDefaultValues, variableDefinitions } from "./variables";
useVariableStore.getState().initialize(getDefaultValues());
initializeVariableColors(variableDefinitions);

import { rollingTwoDiceBlocks } from "./sections/rollingTwoDice";
import { gridOfAllOutcomesBlocks } from "./sections/gridOfAllOutcomes";
import { whySevenWinsBlocks } from "./sections/whySevenWins";
import { readingEventsOffTheGridBlocks } from "./sections/readingEventsOffTheGrid";
import { wrappingUpBlocks } from "./sections/wrappingUp";

export const blocks: ReactElement[] = [
    ...rollingTwoDiceBlocks,
    ...gridOfAllOutcomesBlocks,
    ...whySevenWinsBlocks,
    ...readingEventsOffTheGridBlocks,
    ...wrappingUpBlocks,
];
