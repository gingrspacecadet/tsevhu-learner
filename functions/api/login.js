// functions/api/login.js

// Zero-dependency password hashing using Web Crypto
const encoder = new TextEncoder();

async function hashPassword(password, salt) {
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

  // Fetch stored hash and salt
  const query = `
    SELECT id, password_hash AS hash, salt
      FROM users
     WHERE username = ?
     LIMIT 1
  `;
  const { results } = await env.DB.prepare(query).bind(username).all();

  if (!results || results.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'User not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const user = results[0];
  const { hash: loginHash } = await hashPassword(password, user.salt);

  if (loginHash !== user.hash) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate session token
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Save session token to DB
  await env.DB
    .prepare(`UPDATE users SET sessionToken = ? WHERE id = ?`)
    .bind(token, user.id)
    .run();

  // Return success with Set-Cookie header
  return new Response(
    JSON.stringify({ success: true, userId: user.id }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${token}; HttpOnly; Secure; Path=/; SameSite=Strict`
      }
    }
  );
}
