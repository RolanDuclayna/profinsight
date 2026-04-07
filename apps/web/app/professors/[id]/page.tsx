async function getProfessor(id: string) {
  const res = await fetch(
    `http://localhost:4000/api/professors/${id}`,
    { cache: "no-store" }
  );
  return res.json();
}

export default async function ProfessorProfile({ params }: any) {
  const p = await getProfessor(params.id);

  return (
    <main style={{ padding: 24 }}>
      <h1>{p.name}</h1>
      <p><strong>University:</strong> {p.university}</p>
      <p><strong>Department:</strong> {p.department}</p>
      <p><strong>Rating:</strong> {p.rating}</p>
      <p><strong>Difficulty:</strong> {p.difficulty}</p>

      <a href="/professors">← Back to Professors</a>
    </main>
  );
}
