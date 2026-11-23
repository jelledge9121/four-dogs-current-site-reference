import { secretHash } from '../src/lib/registration-core.ts';
const input=process.env.FDE_INITIAL_OWNER_PASSWORD;
if(!input||input.length<16){
 console.error('Set FDE_INITIAL_OWNER_PASSWORD to a unique 16+ character value in your private environment.');
 process.exit(1);
}
console.log(secretHash(input));
