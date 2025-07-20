'use client';

import { useState } from 'react';

export default function TestGenerator() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('');

    try {
      console.log('Testing API...');

      const response = await fetch('/api/generate-preset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Create a slow blues backing track',
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.preset) {
        setResult(
          `✅ SUCCESS! Generated: ${data.preset.name} at ${data.preset.bpm} BPM`
        );
      } else {
        setResult('❌ ERROR: No preset in response');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setResult(`❌ ERROR: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🧪 API Test</h3>

      <button
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-white border rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        Check browser console for detailed logs
      </div>
    </div>
  );
}
