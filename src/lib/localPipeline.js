/**
 * Client-side re-export of offline pipeline (Vite resolves @/ to src/).
 * Implementation lives in root lib/localPipeline.js for shared server/client use.
 */
export { runLocalPipeline, runPlanPipeline, buildIntentFromPrompt } from '../../lib/localPipeline.js';
