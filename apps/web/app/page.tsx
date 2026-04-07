export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>ProfInsight</h1>
      <p>
        Discover professors, compare courses, and plan your semester.
      </p>

      <p>
        <a href="/login">Login</a> |{" "}
        <a href="/professors">View Professors</a>
      </p>
    </main>
  );
}