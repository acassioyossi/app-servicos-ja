// Temporariamente comentado para resolver problemas de build
// import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai';

// export const ai = genkit({
//   plugins: [googleAI()],
//   model: 'googleai/gemini-2.0-flash',
// });

// Placeholder temporário
export const ai = {
  generate: () => Promise.resolve({ text: () => 'Placeholder response' })
};
