async function getProfessors() {
  const res = await fetch("http://localhost:4000/api/professors", {
    cache: "no-store"
  });
  return res.json();
}

export default async function ProfessorsPage() {
  const professors = await getProfessors();

  return (
    <main style={{ padding: 24 }}>
      <h1>Professors</h1>

      <ul>
        {professors.map((p: any) => (
          <li key={p.id} style={{ marginBottom: 12 }}>
            <a href={`/professors/${p.id}`}>
	     <strong>{p.name}</strong>
            </a>
	    <div>{p.university}</div>
            <div>Rating: {p.rating}</div>
            <div>Difficulty: {p.difficulty}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
