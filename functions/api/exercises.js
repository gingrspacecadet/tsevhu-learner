export async function onRequestGet({ request, env }) {
	const url = new URL(request.url);
	const lessonId = url.searchParams.get("lessonId");

	if (!lessonId) {
		return new Response("Missing lessonId", { status: 400 });
	}

	const db = env.DB;
	const { results } = await db
		.prepare("SELECT * FROM exercises WHERE lesson_id = ? ORDER BY \"order\"")
		.bind(lessonId)
		.all();

	return new Response(JSON.stringify(results), {
		headers: { "Content-Type": "application/json" },
	});
}
