import LoginForm from "@/components/LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="container" style={{ maxWidth: 480 }}>
      <LoginForm next={searchParams.next} />
    </main>
  );
}
