'use client';

import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CSVUploadProps {
  onUploadSuccess: () => void;
}

export default function CSVUpload({ onUploadSuccess }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setDatasetName(selectedFile.name.replace('.csv', ''));
      setError('');
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', datasetName);
      formData.append('description', description);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/data/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      setFile(null);
      setDatasetName('');
      setDescription('');
      onUploadSuccess();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Dataset
        </CardTitle>
        <CardDescription>
          Upload a CSV file to create visualizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">CSV File</label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          
          {file && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Dataset Name</label>
                <Input
                  required
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="Enter dataset name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              
              {error && <p className="text-destructive text-sm">{error}</p>}
              
              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? 'Uploading...' : 'Upload Dataset'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}