async function onRequestGet(context) {
  const id = await context.env.DB.prepare(
    `SELECT id FROM users WHERE sessionToken = ?`
  )
      .bind(sessionToken)
      .first();

  const progress = await context.env.DB.prepare(
    `SELECT * FROM progress WHERE userId = ?`
  )
      .bind(id)
      .all();

  return new Response(JSON.stringify({
    success: true,
    progress: progress,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
