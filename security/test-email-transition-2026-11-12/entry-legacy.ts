// B0 deployment candidate. Copy as send-test-results-email/index.ts after explicit approval.
import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {legacyHandler} from './legacy.ts';
serve(legacyHandler);