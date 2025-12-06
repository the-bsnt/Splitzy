import { AlertCircle, RefreshCw } from "lucide-react";

export default function ServerError() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-slate-900 mb-2">500</h1>
          <h2 className="text-xl text-slate-700 mb-2">Server Error</h2>
          <p className="text-slate-600">
            Something went wrong on our end. Please try again.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Page
        </button>
      </div>
    </div>
  );
}
