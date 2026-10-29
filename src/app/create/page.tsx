"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField, SelectField, DateField } from "@/components/ui/FormFields";
import { PrimaryButton } from "@/components/ui/Buttons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";

const CreateEscrowSchema = z.object({
  // Group 1: Asset
  title: z.string().min(3, "Title required"),
  senderAccount: z.string().min(2, "Sender account required"),
  recipientAccount: z.string().min(2, "Recipient account required"),
  claimRecipientAccount: z.string().optional(),
  deadline: z.string().min(1, "Deadline required"),

  // Group 2: Physical Condition
  indicatorType: z.enum([
    "TEMPERATURE",
    "TAMPER",
    "HUMIDITY",
    "SHOCK",
    "UV",
    "BIOCHEMICAL",
    "CUSTOM",
  ]),
  expectedState: z.string().min(3, "Expected state required"),
  failureState: z.string().min(3, "Failure condition required"),

  // Group 3: Policy
  assetSymbol: z.string().min(1),
  assetAmount: z.string().min(1, "Amount required"),
  destinationChain: z.string().default("NEAR"),
  onViolationAction: z.enum(["REFUND_TO_SENDER", "ROUTE_TO_CLAIM_RECIPIENT"]),
  policyAgreement: z.literal(true, {
    errorMap: () => ({ message: "Confirmation is required" }),
  }),
});

type FormData = z.infer<typeof CreateEscrowSchema>;

export default function CreateEscrowPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultDeadline = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateEscrowSchema),
    defaultValues: {
      title: "mRNA Vaccine Consignment Lot #4029",
      senderAccount: "alice_biopharma.testnet",
      recipientAccount: "geneva_central_hospital.testnet",
      claimRecipientAccount: "zurich_cargo_insurance.testnet",
      deadline: defaultDeadline,
      indicatorType: "TEMPERATURE",
      expectedState: "White baseline window (+2°C to +8°C)",
      failureState: "Magenta dye breach (>+8°C exceeded)",
      assetSymbol: "USDC",
      assetAmount: "50000.00",
      destinationChain: "Arbitrum",
      onViolationAction: "ROUTE_TO_CLAIM_RECIPIENT",
      policyAgreement: false as any,
    },
  });

  const formValues = watch();

  const formattedDeadlineDate = formValues.deadline
    ? new Date(formValues.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "the deadline";

  const violationBeneficiary =
    formValues.onViolationAction === "ROUTE_TO_CLAIM_RECIPIENT" && formValues.claimRecipientAccount
      ? formValues.claimRecipientAccount
      : "returns to you (" + (formValues.senderAccount || "sender") + ")";

  const livePlainSummary = `If the indicator reads safe by ${formattedDeadlineDate}, ${formValues.assetAmount || "0"} ${formValues.assetSymbol || "USDC"} goes to ${formValues.recipientAccount || "recipient"}. If not, it ${formValues.onViolationAction === "ROUTE_TO_CLAIM_RECIPIENT" ? `routes to ${violationBeneficiary}` : violationBeneficiary}.`;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: data.title,
        assetCategory: "Physical Consignment",
        senderAccount: data.senderAccount,
        recipientAccount: data.recipientAccount,
        claimRecipientAccount: data.claimRecipientAccount || undefined,
        deadline: new Date(data.deadline).toISOString(),
        privacyLevel: "STRICT",
        mediaRetentionDays: 30,
        indicator: {
          indicatorType: data.indicatorType,
          expectedState: data.expectedState,
          failureState: data.failureState,
          bindingMethod: "QR_CODE",
        },
        policy: {
          assetSymbol: data.assetSymbol,
          assetAmount: data.assetAmount,
          destinationChain: data.destinationChain,
          onConditionMet: {
            action: "RELEASE_TO_RECIPIENT",
            destinationChain: data.destinationChain,
          },
          onConditionViolated: {
            action: data.onViolationAction,
            claimAllocationPercentage: 100,
            requiresManualReview: false,
          },
          onInconclusive: {
            action: "ALLOW_RESCAN_UNTIL_DEADLINE",
            maxRescans: 3,
          },
          onExpiry: {
            action: "AUTO_REFUND_TO_SENDER",
          },
          requiresManualReview: false,
        },
      };

      const res = await fetch("/api/escrows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create escrow");
      }

      router.push(`/escrows/${json.escrow.publicId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit escrow");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-10 space-y-10">
      <div>
        <h1 className="text-h2 font-heading font-semibold text-ink-primary">
          Create an escrow
        </h1>
        <p className="text-small text-ink-secondary mt-1">
          Lock funds against a physical indicator condition on NEAR.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: 3 Field Groups (8 cols on large screens) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Group 1: Asset & Accounts */}
            <div className="rounded-card border border-border bg-surface p-6 space-y-4">
              <h2 className="text-small font-semibold uppercase text-ink-muted">
                1. Asset & Participants
              </h2>

              <TextField
                label="Escrow Title"
                placeholder="mRNA Vaccine Lot #4029"
                required
                {...register("title")}
                error={errors.title?.message}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Sender Account"
                  placeholder="alice.testnet"
                  required
                  {...register("senderAccount")}
                  error={errors.senderAccount?.message}
                />
                <TextField
                  label="Recipient Account"
                  placeholder="hospital.testnet"
                  required
                  {...register("recipientAccount")}
                  error={errors.recipientAccount?.message}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Claim Recipient (Insurer / Optional)"
                  placeholder="insurance.testnet"
                  {...register("claimRecipientAccount")}
                />
                <DateField
                  label="Deadline"
                  required
                  {...register("deadline")}
                  error={errors.deadline?.message}
                />
              </div>
            </div>

            {/* Group 2: Physical Condition */}
            <div className="rounded-card border border-border bg-surface p-6 space-y-4">
              <h2 className="text-small font-semibold uppercase text-ink-muted">
                2. Physical Indicator
              </h2>

              <SelectField
                label="Indicator Category"
                required
                {...register("indicatorType")}
                options={[
                  { value: "TEMPERATURE", label: "Temperature (Cold Chain)" },
                  { value: "TAMPER", label: "Tamper-Evident Seal" },
                  { value: "HUMIDITY", label: "Humidity Card" },
                  { value: "SHOCK", label: "Mechanical Shock Sensor" },
                  { value: "BIOCHEMICAL", label: "Biochemical Test Strip" },
                  { value: "UV", label: "UV Exposure Strip" },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Expected Condition (Safe)"
                  placeholder="e.g. White baseline window"
                  required
                  {...register("expectedState")}
                  error={errors.expectedState?.message}
                />
                <TextField
                  label="Failure Condition (Violated)"
                  placeholder="e.g. Magenta dye breach"
                  required
                  {...register("failureState")}
                  error={errors.failureState?.message}
                />
              </div>
            </div>

            {/* Group 3: Settlement Policy */}
            <div className="rounded-card border border-border bg-surface p-6 space-y-4">
              <h2 className="text-small font-semibold uppercase text-ink-muted">
                3. Settlement Policy
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <TextField
                    label="Locked Amount"
                    placeholder="50000.00"
                    required
                    {...register("assetAmount")}
                    error={errors.assetAmount?.message}
                  />
                </div>
                <SelectField
                  label="Asset"
                  required
                  {...register("assetSymbol")}
                  options={[
                    { value: "USDC", label: "USDC" },
                    { value: "USDT", label: "USDT" },
                    { value: "NEAR", label: "NEAR" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Destination Chain"
                  required
                  {...register("destinationChain")}
                  options={[
                    { value: "Arbitrum", label: "Arbitrum (NEAR Intents)" },
                    { value: "NEAR", label: "NEAR Protocol" },
                    { value: "Ethereum", label: "Ethereum" },
                    { value: "Base", label: "Base" },
                    { value: "Solana", label: "Solana" },
                  ]}
                />
                <SelectField
                  label="If Condition Violated"
                  required
                  {...register("onViolationAction")}
                  options={[
                    { value: "ROUTE_TO_CLAIM_RECIPIENT", label: "Route to Claim Recipient" },
                    { value: "REFUND_TO_SENDER", label: "Refund to Sender" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Right: Pinned Live Plain-English Summary (4 cols on large screens) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-card border border-border bg-surface p-6 space-y-5">
              <span className="text-label uppercase tracking-wider text-ink-muted font-semibold block">
                Settlement Statement
              </span>

              {/* The Trust-Building Plain English Line */}
              <blockquote className="text-body font-heading font-medium text-ink-primary border-l-2 border-primary pl-4 py-1 leading-snug">
                "{livePlainSummary}"
              </blockquote>

              <div className="border-t border-border pt-4 space-y-2 text-small">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Locked Amount:</span>
                  <span className="font-mono font-medium text-ink-primary">
                    {formatCurrency(formValues.assetAmount || "0", formValues.assetSymbol || "USDC")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Physical Oracle:</span>
                  <span className="font-medium text-ink-primary">{formValues.indicatorType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Settlement Chain:</span>
                  <span className="font-mono text-ink-primary">{formValues.destinationChain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Consensus:</span>
                  <span className="font-mono text-ink-primary">NEAR Protocol</span>
                </div>
              </div>

              {/* Explicit agreement checkbox */}
              <div className="border-t border-border pt-4 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-primary focus:ring-primary h-4 w-4 mt-0.5"
                    {...register("policyAgreement")}
                  />
                  <span className="text-xs text-ink-secondary leading-normal">
                    I confirm that funds will lock according to this policy, released only when the physical evidence is verified.
                  </span>
                </label>
                {errors.policyAgreement && (
                  <p className="text-xs text-status-critical font-medium">
                    {errors.policyAgreement.message}
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="rounded-input border border-status-critical/30 bg-status-critical-soft p-3 text-xs text-status-critical">
                  {errorMsg}
                </div>
              )}

              <PrimaryButton
                type="submit"
                loading={submitting}
                className="w-full"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Create escrow
              </PrimaryButton>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
