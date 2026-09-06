import type { RequestHandler } from './$types';
import { handleGenerate } from '$lib/server/pgm-api';

export const POST: RequestHandler = ({ request }) => handleGenerate(request);
