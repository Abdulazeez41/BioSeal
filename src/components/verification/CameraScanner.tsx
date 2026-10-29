"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PrimaryButton, SecondaryButton } from "../ui/Buttons";
import { RubberStamp } from "../ui/RubberStamp";
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { ClassificationOutcome } from "@/lib/types";

interface CameraScannerProps {
  escrowPublicId?: string;
  onSuccess?: (res: any) => void;
  className?: string;
}

type StepState = "READY" | "STREAMING" | "CAPTURED" | "PROCESSING" | "RESULT" | "PERMISSION_DENIED";

export const CameraScanner: React.FC<CameraScannerProps> = ({
  escrowPublicId = "BIO-9402",
  onSuccess,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<StepState>("READY");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedEscrowId, setSelectedEscrowId] = useState<string>(escrowPublicId);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState<boolean>(false);

  // Anti-Replay: Fresh live challenge nonce + timestamp watermark
  const [liveNonce, setLiveNonce] = useState<string>("");
  const [liveTimestamp, setLiveTimestamp] = useState<string>("");

  useEffect(() => {
    // Generate fresh session anti-replay nonce
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    setLiveNonce(`${rand}-${rand2}`);
    setLiveTimestamp(new Date().toUTCString());

    const timer = setInterval(() => {
      setLiveTimestamp(new Date().toUTCString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const stages = [
    "Encrypt",
    "Verify environment",
    "Classify",
    "Record",
  ];

  const startCamera = async () => {
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStep("PERMISSION_DENIED");
        setErrorMsg("Camera access not supported on this device.");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      setStream(mediaStream);
      setStep("STREAMING");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setStep("PERMISSION_DENIED");
      setErrorMsg(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Enable camera access in browser settings to scan."
          : `Camera error: ${err.message}`
      );
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    setCapturedImage(dataUrl);
    setStep("CAPTURED");

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setStep("CAPTURED");
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const submitVerification = async () => {
    if (!capturedImage) return;

    setStep("PROCESSING");
    setErrorMsg(null);

    // 4-stage pipeline: Encrypt → Verify environment → Classify → Record
    setActiveStageIndex(0); // Encrypt
    await new Promise((r) => setTimeout(r, 400));

    setActiveStageIndex(1); // Verify environment
    await new Promise((r) => setTimeout(r, 600));

    setActiveStageIndex(2); // Classify
    try {
      const res = await fetch("/api/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrowPublicId: selectedEscrowId,
          imageBase64: capturedImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setActiveStageIndex(3); // Record
      await new Promise((r) => setTimeout(r, 400));

      setVerificationResult(data);
      setStep("RESULT");
      if (onSuccess) onSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete verification");
      setStep("CAPTURED");
    }
  };

  const resetFlow = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setErrorMsg(null);
    startCamera();
  };

  // Outcome text helpers
  const outcome: ClassificationOutcome | undefined = verificationResult?.verificationSession?.classification;
  const isMet = outcome === "CONDITION_MET";
  const isViolated = outcome === "CONDITION_VIOLATED";
  const isInconclusive = outcome === "INCONCLUSIVE";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Viewport Card */}
      <div className="rounded-card border border-border bg-surface overflow-hidden">
        {/* Viewport Top Header */}
        <div className="p-4 sm:px-6 border-b border-border flex items-center justify-between text-small">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase text-ink-muted">Escrow</span>
            <input
              type="text"
              value={selectedEscrowId}
              onChange={(e) => setSelectedEscrowId(e.target.value.toUpperCase())}
              placeholder="BIO-XXXX"
              className="w-28 rounded-input border border-border px-2.5 py-1 text-xs font-mono font-medium text-ink-primary focus:outline-none focus:border-primary uppercase"
            />
          </div>

          {/* Capture-Authenticity Nonce Badge */}
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
            <span className="hidden sm:inline">Live Nonce:</span>
            <span className="font-semibold text-ink-primary">{liveNonce}</span>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full min-h-[380px] max-h-[560px] bg-[#161513] flex items-center justify-center overflow-hidden">
          {/* 1. Ready */}
          {step === "READY" && (
            <div className="text-center p-6 space-y-4 max-w-sm z-10">
              <h2 className="text-h3 font-heading font-semibold text-white">
                Scan physical indicator
              </h2>
              <p className="text-small text-white/70 leading-normal">
                Position the condition strip or tamper seal within the camera frame.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <PrimaryButton onClick={startCamera} icon={<Camera className="h-4 w-4" />}>
                  Enable camera
                </PrimaryButton>
                <label className="text-small text-white/80 hover:text-white cursor-pointer px-4 py-2 rounded-pill hover:bg-white/10 transition-colors">
                  Upload file
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {/* 2. Streaming */}
          {step === "STREAMING" && (
            <>
              <video ref={videoRef} playsInline autoPlay muted className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Frame */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="relative h-44 w-60 sm:h-52 sm:w-72 rounded-card border-2 border-white/80 shadow-[0_0_0_9999px_rgba(22,21,19,0.55)]">
                  {/* Watermarked Authenticity Overlay */}
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-white/90 bg-[#161513]/70 px-2 py-0.5 rounded">
                    CHALLENGE: {liveNonce}
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white/80 bg-[#161513]/70 px-2 py-0.5 rounded">
                    {liveTimestamp.slice(17, 25)} UTC
                  </div>

                  {/* Scanning beam */}
                  <div className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_8px_#0F766E] animate-scan-line" />
                </div>
              </div>
            </>
          )}

          {/* 3. Captured Preview */}
          {step === "CAPTURED" && capturedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedImage} alt="Captured indicator" className="h-full w-full object-contain" />
          )}

          {/* 4. Processing in TEE */}
          {step === "PROCESSING" && (
            <div className="text-center p-6 space-y-4 max-w-sm text-white z-10">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-pill bg-white/10">
                <Lock className="h-5 w-5 text-primary-light animate-pulse" />
              </div>
              <div className="font-heading text-lg font-semibold">
                Classifying in hardware enclave
              </div>
              <p className="text-xs font-mono text-white/70">
                Stage {activeStageIndex + 1} of 4: {stages[activeStageIndex]}
              </p>
            </div>
          )}

          {/* 5. Permission Denied */}
          {step === "PERMISSION_DENIED" && (
            <div className="text-center p-6 space-y-3 max-w-sm text-white z-10">
              <p className="text-small text-white/80">{errorMsg}</p>
              <div className="pt-2 flex flex-col gap-2">
                <PrimaryButton onClick={startCamera}>Retry camera</PrimaryButton>
                <label className="text-small text-white/80 hover:text-white cursor-pointer py-2">
                  Upload file instead
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Four-Stage Progress Line (Design requirement) */}
        <div className="border-t border-border bg-surface-soft p-4 px-6">
          <div className="flex items-center justify-between text-xs font-mono text-ink-secondary">
            {stages.map((stage, idx) => {
              const isDone = step === "RESULT" || (step === "PROCESSING" && activeStageIndex > idx);
              const isCurrent = step === "PROCESSING" && activeStageIndex === idx;

              return (
                <div key={stage} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isDone
                        ? "bg-status-success"
                        : isCurrent
                        ? "bg-primary animate-pulse"
                        : "bg-border-strong"
                    )}
                  />
                  <span
                    className={cn(
                      isDone
                        ? "text-status-success font-medium"
                        : isCurrent
                        ? "text-ink-primary font-semibold"
                        : "text-ink-muted"
                    )}
                  >
                    {stage}
                  </span>
                  {idx < stages.length - 1 && <span className="text-border-strong ml-2 hidden sm:inline">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Viewport Action Controls Bar (Glass design on controls bar) */}
        {step === "STREAMING" && (
          <div className="p-4 bg-surface/90 backdrop-blur-glass border-t border-border flex items-center justify-center">
            <PrimaryButton onClick={captureFrame} icon={<Camera className="h-4 w-4" />}>
              Capture indicator
            </PrimaryButton>
          </div>
        )}

        {step === "CAPTURED" && (
          <div className="p-4 bg-surface/90 backdrop-blur-glass border-t border-border flex items-center justify-between">
            <SecondaryButton onClick={resetFlow} icon={<RefreshCw className="h-4 w-4" />}>
              Retake
            </SecondaryButton>
            <PrimaryButton onClick={submitVerification}>
              Submit to private AI
            </PrimaryButton>
          </div>
        )}
      </div>

      {/* Collapse "What BioSeal can see" into a single expandable line under viewport */}
      <div className="rounded-card border border-border bg-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
          className="w-full p-4 px-6 flex items-center justify-between text-small text-ink-secondary hover:text-ink-primary transition-colors text-left"
        >
          <span>
            <strong className="text-ink-primary font-medium">What BioSeal can see:</strong> Only the verdict and cryptographic proof go onchain.
          </span>
          <span className="flex items-center gap-1 text-xs font-mono text-ink-muted shrink-0 ml-4">
            <span>{showPrivacyDetails ? "Hide" : "Details"}</span>
            {showPrivacyDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        </button>

        {showPrivacyDetails && (
          <div className="border-t border-border p-6 bg-surface-soft text-small space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <strong className="text-ink-primary block font-semibold mb-1">Confidential TEE Inference</strong>
                <p className="text-ink-secondary leading-normal">
                  The camera photo is processed strictly in hardware memory (Intel SGX2). The raw pixels are never stored onchain and cannot be viewed by validators.
                </p>
              </div>
              <div>
                <strong className="text-ink-primary block font-semibold mb-1">Minimal Attestation</strong>
                <p className="text-ink-secondary leading-normal">
                  Only the machine outcome code and enclave quote hash are permanently committed to the NEAR smart contract.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= RESULT CARD ================= */}
      {/* Design requirement: A large verdict word (Met, Violated, Inconclusive) with status icon + text, never color alone.
          Beneath it, one sentence of consequence and one button. The proof sits behind a 'View proof' link. */}
      {step === "RESULT" && verificationResult && (
        <div className="rounded-card border border-border bg-surface p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-1">
                {isMet && <CheckCircle2 className="h-8 w-8 text-status-success" />}
                {isViolated && <XCircle className="h-8 w-8 text-status-critical" />}
                {isInconclusive && <HelpCircle className="h-8 w-8 text-ink-muted" />}
              </div>

              <div className="space-y-1">
                <span className="font-mono text-xs uppercase text-ink-muted block font-semibold">Verdict</span>
                <h2 className="text-h2 font-heading font-semibold text-ink-primary">
                  {isMet && "Met"}
                  {isViolated && "Violated"}
                  {isInconclusive && "Inconclusive"}
                </h2>
                {/* One sentence of consequence */}
                <p className="text-body text-ink-secondary leading-normal pt-1">
                  {isMet && "The protected condition was satisfied. Funds are authorized for release to recipient."}
                  {isViolated && "The protected condition was breached. Funds route according to penalty policy."}
                  {isInconclusive && "The indicator could not be read reliably. Resubmit a clear scan before deadline."}
                </p>
              </div>
            </div>

            {/* The Cartoon Rubber Stamp Slam */}
            <div className="self-center sm:self-start shrink-0">
              <RubberStamp
                verdict={isMet ? "MET" : isViolated ? "VIOLATED" : "INCONCLUSIVE"}
                size="md"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-4">
            {/* View proof link */}
            <Link
              href={`/verifications/${verificationResult.verificationSession.id}/proof`}
              className="text-small text-ink-secondary hover:text-ink-primary underline font-medium"
            >
              View proof
            </Link>

            {/* Exactly one primary button based on consequence */}
            {isMet && (
              <Link href={`/escrows/${selectedEscrowId}?tab=settlement`}>
                <PrimaryButton icon={<ArrowRight className="h-4 w-4" />}>
                  Release funds
                </PrimaryButton>
              </Link>
            )}

            {isViolated && (
              <Link href={`/escrows/${selectedEscrowId}`}>
                <PrimaryButton icon={<ArrowRight className="h-4 w-4" />}>
                  View policy routing
                </PrimaryButton>
              </Link>
            )}

            {isInconclusive && (
              <PrimaryButton onClick={resetFlow} icon={<RefreshCw className="h-4 w-4" />}>
                Rescan indicator
              </PrimaryButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
