export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-900 mb-4">
          Inbound Knowledge Base
        </h1>
        <p className="text-lg text-primary-700 mb-8">
          Internal documentation platform for Inbound.no
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            Login
          </a>
          <a
            href="/signup"
            className="px-6 py-3 bg-primary-200 text-primary-900 rounded-lg hover:bg-primary-300 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </div>
    </main>
  );
}
