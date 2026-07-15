"use client";

import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface UploadOverlayProps {
    isOpen: boolean;
    isError: boolean;
    isSuccess?: boolean;
    errorMessage?: string;
    successMessage?: string;
    onRetry: () => void;
    onCloseSuccess?: () => void;
}

export function UploadOverlay({ isOpen, isError, isSuccess, errorMessage, successMessage, onRetry, onCloseSuccess }: UploadOverlayProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background w-[90vw] max-w-md rounded-xl p-6 shadow-lg border text-center flex flex-col items-center">
                {isError ? (
                    <>
                        <div className="bg-destructive/10 p-3 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight mb-2">Upload Failed</h2>
                        <p className="text-muted-foreground mb-6 text-sm">
                            {errorMessage || "There are files that failed to upload due to network or server issues."}
                        </p>
                        <Button onClick={onRetry} variant="default" className="w-full">
                            Try Again
                        </Button>
                    </>
                ) : isSuccess ? (
                    <>
                        <div className="bg-green-500/10 p-3 rounded-full mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight mb-2">Success!</h2>
                        <p className="text-muted-foreground mb-6 text-sm">
                            {successMessage || "Files and data uploaded successfully."}
                        </p>
                        {onCloseSuccess && (
                            <Button onClick={onCloseSuccess} variant="default" className="w-full">
                                Close
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <div className="bg-primary/10 p-4 rounded-full mb-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight mb-2">Uploading...</h2>
                        <p className="text-muted-foreground text-sm">
                            Please wait a moment, do not close this page.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
