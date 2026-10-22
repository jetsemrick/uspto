import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            USPTO AI Demos
          </h1>
          <p className="text-lg text-gray-600">
            Demonstration systems for USPTO Super Intelligence Roundtable
          </p>
        </header>

        <div className="grid gap-6">
          {/* Readiness Check Demo */}
          <Link
            href="/readiness"
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-600"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Application Readiness & Formalities Check
            </h2>
            <p className="text-gray-600 mb-4">
              Modular REST/JSON API component for automated patent application
              readiness verification. Performs formalities checks including
              abstract length, claim formatting, drawing references, page
              numbering, and antecedent basis.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                USPTO Objective 1a
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                50 Test Applications
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Grok API
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Precision/Recall Eval
              </span>
            </div>
          </Link>

          {/* Examiner Workspace (existing) */}
          <Link
            href="/examiner"
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-purple-600"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              §103 Obviousness Examiner Workspace
            </h2>
            <p className="text-gray-600 mb-4">
              Desktop tool for patent examiners to evaluate obviousness under 35
              U.S.C. §103. Load an application and prior-art references, confirm
              limitation splits, review sourced claim charts, and get neutral
              evaluations.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                35 U.S.C. §103
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Graham Factors
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Claim Charts
              </span>
            </div>
          </Link>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            SpaceXAI / Anysphere • USPTO Super Intelligence Roundtable • Nov 10,
            2026
          </p>
        </footer>
      </div>
    </div>
  );
}
