"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import type { PutBlobResult } from "@vercel/blob";

interface UploadScreenshotProps {
  onUploadComplete?: (url: string) => void;
}

export function UploadScreenshot({ onUploadComplete }: UploadScreenshotProps) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inputFileRef.current?.files || inputFileRef.current.files.length === 0) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const file = inputFileRef.current.files[0];

    // Check file size (max 4.5MB for server uploads)
    if (file.size > 4.5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 4.5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const newBlob = (await response.json()) as PutBlobResult;
      setBlob(newBlob);

      toast({
        title: "Upload successful",
        description: "Your file has been uploaded successfully",
      });

      if (onUploadComplete) {
        onUploadComplete(newBlob.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    setBlob(null);
    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Upload Flight Screenshot or Boarding Pass
            </div>
          </Label>

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                name="file"
                ref={inputFileRef}
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileChange}
                required
                className="flex-1"
              />
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Supported formats: JPEG, PNG, WebP (Max 4.5MB)
          </p>
        </div>

        <Button type="submit" disabled={uploading || !preview}>
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </form>

      {blob && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium">File uploaded successfully!</p>
          <a
            href={blob.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            {blob.url}
          </a>
        </div>
      )}
    </div>
  );
}
