export async function onRequestGet(context) {
    // Query lessons table, not exercises
    const stmt = context.env.DB.prepare(`
        SELECT * FROM lessons ORDER BY title
    `);

    const lessons = await stmt.all();

    // Return properly formatted JSON response
    return new Response(JSON.stringify({
        success: true,
        meta: {},
        results: lessons.results || []
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
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
