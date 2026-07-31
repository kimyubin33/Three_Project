import { thawingSteps } from './thawingSteps.js';
import { injectionSteps } from './injectionSteps.js';
import { iceIncubationSteps } from './iceIncubationSteps.js';

export const STEPS_BY_CHAPTER = {
    1: thawingSteps,
    3: injectionSteps,
    4: iceIncubationSteps
};

export function getStepsForChapter(chapterId) {
    return STEPS_BY_CHAPTER[chapterId] || [];
}