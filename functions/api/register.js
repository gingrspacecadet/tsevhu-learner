// functions/api/register.js

const encoder = new TextEncoder();

async function hashPassword(password, salt = null) {
  if (!salt) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const pwBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const baseKey = await crypto.subtle.importKey(
    'raw', pwBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return { salt, hash: hashHex };
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { username, password } = body;
  if (!username || !password) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing username or password' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { hash, salt } = await hashPassword(password);

  try {
    const insert = `
      INSERT INTO users (username, password_hash, salt)
      VALUES (?, ?, ?)
    `;
    const result = await env.DB.prepare(insert).bind(username, hash, salt).run();

    return new Response(
      JSON.stringify({ success: true, userId: result.meta.last_row_id }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ success: false, error: 'Database error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}