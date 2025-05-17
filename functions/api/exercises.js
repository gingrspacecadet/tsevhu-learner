export async function onRequest({ request, env }) {
    if (request.method !== 'GET') {
      return new Response(null, { status: 405 });
    }
  
    const url = new URL(request.url);
    const lessonId = url.searchParams.get('lesson_id');
    if (!lessonId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing lessonId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    // Get session token from cookies
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
  
    const session = cookies.session;
    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    // Find userId from session token
    const userResult = await env.DB.prepare(
      `SELECT id FROM users WHERE sessionToken = ?`
    ).bind(session).first();
  
    if (!userResult) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    const userId = userResult.id;
  
    // Query exercises for this lesson
    const exercisesQuery = `
      SELECT id AS exerciseId, description -- select whatever columns you want here
        FROM exercises
       WHERE lessonId = ?
    `;
    const exercisesResult = await env.DB.prepare(exercisesQuery).bind(lessonId).all();
  
    const exercises = exercisesResult.results;
  
    if (exercises.length === 0) {
      return new Response(
        JSON.stringify({ success: true, exercises: [] }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    // Get exerciseIds from result
    const exerciseIds = exercises.map(e => e.exerciseId);
  
    // Query progress to see which exercises user completed
    const placeholders = exerciseIds.map(() => '?').join(', ');
    const progressQuery = `
      SELECT exerciseId FROM progress
      WHERE userId = ? AND lessonId = ? AND exerciseId IN (${placeholders})
    `;
    const progressResults = await env.DB.prepare(progressQuery)
      .bind(userId, lessonId, ...exerciseIds)
      .all();
  
    const completedSet = new Set(progressResults.results.map(r => r.exerciseId));
  
    // Map exercises and add completed flag
    const exercisesWithStatus = exercises.map(e => ({
      ...e,
      completed: completedSet.has(e.exerciseId)
    }));
  
    return new Response(
      JSON.stringify({ success: true, exercises: exercisesWithStatus }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  