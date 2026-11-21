import postgres from 'postgres';
import fs from 'node:fs';
if (!process.env.FDE_REGISTRATION_DATABASE_URL) {
 console.error('FDE_REGISTRATION_DATABASE_URL is missing. Refusing to initialize a database.');
 process.exitCode=1;
} else {
 const sql=postgres(process.env.FDE_REGISTRATION_DATABASE_URL,{max:1,connect_timeout:10});
 try {
  const migration=fs.readFileSync('db/registration-schema.sql','utf8');
  // SQL comes only from the reviewed, committed schema file. No user input is interpolated.
  await sql.unsafe(migration).simple();
  const rows=await sql.unsafe("SELECT to_regclass('fde_registration.registrations') AS table_name");
  if(!rows[0]?.table_name) throw new Error('Registration schema was not created');
  console.log('Isolated registration schema verified. No new database provisioned.');
 }catch(err){console.error('Registration schema setup failed:',String(err));process.exitCode=1}
 finally{await sql.end({timeout:5})}
}
