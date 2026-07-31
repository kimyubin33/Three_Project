import { thawingSteps } from './thawingSteps.js';
import { injectionSteps } from './injectionSteps.js';
import { iceIncubationSteps } from './iceIncubationSteps.js';
import { heatShockSteps } from './heatShockSteps.js';
import { socAdditionSteps } from './socAdditionSteps.js';
import { shakingSteps } from './shakingSteps.js';

export const STEPS_BY_CHAPTER = {
    1: thawingSteps,
    3: injectionSteps,
    4: iceIncubationSteps,
    5: heatShockSteps,
    6: socAdditionSteps,
    7: shakingSteps
};

export function getStepsForChapter(chapterId) {
    return STEPS_BY_CHAPTER[chapterId] || [];
}