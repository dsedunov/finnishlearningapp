import React, { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  dataUrls: {
    lessons: string;
    translations: string;
  };
  onUrlChange: (type: 'lessons' | 'translations', url: string) => void;
  onLoadFromUrl: (url: string, type: 'lessons' | 'translations') => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, type: 'lessons' | 'translations') => void;
  dataLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  dataUrls,
  onUrlChange,
  onLoadFromUrl,
  onFileUpload,
  dataLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const translationInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Load Data from URLs or Upload Files
      </h2>
      
      {/* URL Input Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Load from URLs</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lessons URL
            </label>
            <div className="flex">
              <input
                type="url"
                value={dataUrls.lessons}
                onChange={(e) => onUrlChange('lessons', e.target.value)}
                className="flex-1 border rounded-l-lg px-3 py-2 text-sm"
                placeholder="Enter lessons URL..."
              />
              <button
                onClick={() => onLoadFromUrl(dataUrls.lessons, 'lessons')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg text-sm"
                disabled={dataLoading}
              >
                Load
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Translations URL
            </label>
            <div className="flex">
              <input
                type="url"
                value={dataUrls.translations}
                onChange={(e) => onUrlChange('translations', e.target.value)}
                className="flex-1 border rounded-l-lg px-3 py-2 text-sm"
                placeholder="Enter translations URL..."
              />
              <button
                onClick={() => onLoadFromUrl(dataUrls.translations, 'translations')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-r-lg text-sm"
                disabled={dataLoading}
              >
                Load
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Or Upload JSON Files</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lessons File</h3>
            <p className="text-gray-600 mb-4">JSON file with lessons and exercises</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => onFileUpload(e, 'lessons')}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Choose File
            </button>
          </div>

          <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center hover:border-green-500 transition-colors">
            <FileText className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Translations File</h3>
            <p className="text-gray-600 mb-4">JSON file with word translations</p>
            <input
              ref={translationInputRef}
              type="file"
              accept=".json"
              onChange={(e) => onFileUpload(e, 'translations')}
              className="hidden"
            />
            <button
              onClick={() => translationInputRef.current?.click()}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Choose File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
