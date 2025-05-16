export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const lessonId = url.searchParams.get('lesson_id');

    if (lessonId) {
        // Return single lesson by id
        const stmt = context.env.DB.prepare(`
            SELECT * FROM lessons WHERE id = ?
        `).bind(lessonId);
        const lesson = await stmt.get();
        return new Response(JSON.stringify(lesson), {
            headers: { 'Content-Type': 'application/json' },
        });
    } else {
        // Return all lessons
        const stmt = context.env.DB.prepare(`
            SELECT * FROM lessons ORDER BY title
        `);
        const lessons = await stmt.all();
        return new Response(JSON.stringify(lessons), {
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
  
  
export async function onRequestPost(context) {
    const body = await context.request.json();
    const id = crypto.randomUUID();
  
    const stmt = context.env.DB.prepare(`
        INSERT INTO lessons (id, title, description) VALUES (?, ?, ?)
    `).bind(id, body.title, body.description);
  
    await stmt.run();
  
    return new Response(JSON.stringify({ id }), {
        headers: { 'Content-Type': 'application/json' },
    });
}  
