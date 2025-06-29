import React, { useState } from 'react';
import { Server, FileText, AlertTriangle, CheckCircle, XCircle, Folder } from 'lucide-react';

const ServerDebugTool: React.FC = () => {
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runServerDiagnostics = async () => {
    setTesting(true);
    const results: any[] = [];

    // Test 1: Basic server info
    results.push({
      test: "Server Base URL",
      status: "info", 
      result: window.location.origin,
      description: "Current server base URL"
    });

    // Test 2: Check if we can create and test a file
    try {
      // Test with a known working file (manifest.json should exist)
      const manifestTest = await fetch('/manifest.json');
      results.push({
        test: "Manifest.json Access",
        status: manifestTest.ok ? "success" : "error",
        result: `${manifestTest.status} ${manifestTest.statusText}`,
        description: "Testing access to default public file"
      });
    } catch (error) {
      results.push({
        test: "Manifest.json Access", 
        status: "error",
        result: `Error: ${error}`,
        description: "Failed to access default public file"
      });
    }

    // Test 3: Check robots.txt (another default file)
    try {
      const robotsTest = await fetch('/robots.txt');
      results.push({
        test: "Robots.txt Access",
        status: robotsTest.ok ? "success" : "error", 
        result: `${robotsTest.status} ${robotsTest.statusText}`,
        description: "Testing access to another default public file"
      });
    } catch (error) {
      results.push({
        test: "Robots.txt Access",
        status: "error",
        result: `Error: ${error}`,
        description: "Failed to access robots.txt"
      });
    }

    // Test 4: Try non-existent file to see 404 behavior
    try {
      const notFoundTest = await fetch('/nonexistent-file-test.json');
      const responseText = await notFoundTest.text();
      results.push({
        test: "404 Behavior Test",
        status: "info",
        result: `${notFoundTest.status} - Content Type: ${notFoundTest.headers.get('content-type')} - Length: ${responseText.length}`,
        description: "How server handles missing files",
        details: responseText.substring(0, 200)
      });
    } catch (error) {
      results.push({
        test: "404 Behavior Test",
        status: "error", 
        result: `Error: ${error}`,
        description: "Error testing 404 behavior"
      });
    }

    // Test 5: Check current working directory and environment
    results.push({
      test: "Environment Info",
      status: "info",
      result: `Node Env: ${process.env.NODE_ENV || 'development'}`,
      description: "Current environment information"
    });

    setDebugResults(results);
    setTesting(false);
  };

  const testCustomFile = async () => {
    // This will help us create a test file programmatically
    const testContent = JSON.stringify({
      test: "Server debug test file",
      timestamp: new Date().toISOString(),
      message: "If you can see this, the server is working correctly"
    }, null, 2);

    // We can't actually create files from the frontend, but we can test if the user creates one
    const results = [...debugResults];
    
    try {
      const testResponse = await fetch('/debug-test.json');
      if (testResponse.ok) {
        const content = await testResponse.text();
        results.push({
          test: "Custom Test File",
          status: "success",
          result: "Test file found and accessible!",
          description: "Your custom debug-test.json file is working",
          details: content.substring(0, 200)
        });
      } else {
        results.push({
          test: "Custom Test File", 
          status: "warning",
          result: `File not found (${testResponse.status})`,
          description: "Create debug-test.json in public/ folder to test"
        });
      }
    } catch (error) {
      results.push({
        test: "Custom Test File",
        status: "error",
        result: `Error: ${error}`,
        description: "Failed to test custom file"
      });
    }

    setDebugResults(results);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <Server className="w-8 h-8 mr-3" />
                Server Debug Tool
              </h1>
              <p className="text-gray-600">Diagnosing React development server configuration</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Debug Instructions</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p><strong>Step 1:</strong> Click "Run Server Diagnostics" to test basic server functionality</p>
              <p><strong>Step 2:</strong> Create a test file in your public/ folder called "debug-test.json" with this content:</p>
              <pre className="bg-white p-3 rounded border mt-2 text-xs overflow-x-auto">
{`{
  "test": "Server debug test file",
  "timestamp": "${new Date().toISOString()}",
  "message": "If you can see this, the server is working correctly"
}`}
              </pre>
              <p><strong>Step 3:</strong> Click "Test Custom File" to see if your file is accessible</p>
              <p><strong>Step 4:</strong> Check the results below for clues about the server configuration</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={runServerDiagnostics}
              disabled={testing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg flex items-center"
            >
              <Server className="w-5 h-5 mr-2" />
              Run Server Diagnostics
            </button>
            
            <button
              onClick={testCustomFile}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center"
            >
              <FileText className="w-5 h-5 mr-2" />
              Test Custom File
            </button>
          </div>

          {/* Results */}
          {debugResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Diagnostic Results</h3>
              
              {debugResults.map((result, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{result.test}</h4>
                      <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                      <p className="text-sm font-mono bg-white p-2 rounded border">
                        {result.result}
                      </p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium text-gray-700">
                            Show Details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {result.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Troubleshooting Guide */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              <Folder className="w-5 h-5 inline mr-2" />
              Common Issues & Solutions
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <strong>If manifest.json fails:</strong> Basic public folder serving is broken. Restart dev server.
              </div>
              <div>
                <strong>If 404s return HTML:</strong> React dev server is configured to serve index.html for all routes (SPA mode).
              </div>
              <div>
                <strong>If custom test file fails:</strong> Files aren't being served from public/ folder correctly.
              </div>
              <div>
                <strong>Alternative solution:</strong> Import JSON files directly into your React components instead of fetching them.
              </div>
            </div>
          </div>

          {/* Alternative Approach */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Alternative: Import JSON Directly</h3>
            <p className="text-sm text-yellow-700 mb-3">
              If serving JSON files continues to fail, you can import them directly in your React components:
            </p>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`// Move JSON files to src/ folder instead of public/
// src/data/chapters.json
// src/data/vocabulary.json  
// src/data/audio_scripts.json

// Then import them in App.tsx:
import chaptersData from './data/chapters.json';
import vocabularyData from './data/vocabulary.json';
import audioScriptsData from './data/audio_scripts.json';

// Use directly without fetch:
useEffect(() => {
  setAppState(prev => ({
    ...prev,
    chaptersData,
    vocabularyData,
    audioScriptsData
  }));
  initializeProgressForNewData(chaptersData);
}, []);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerDebugTool;