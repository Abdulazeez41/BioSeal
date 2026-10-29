use near_sdk::collections::{LookupMap, UnorderedMap};
use near_sdk::json_types::U128;
use near_sdk::{env, near, require, AccountId, PanicOnDefault, Promise, NearToken};

#[near(serializers = [borsh, json])]
#[derive(Clone, PartialEq, Debug)]
pub enum EscrowStatus {
    Draft,
    AwaitingFunding,
    Active,
    ConditionMet,
    ConditionViolated,
    Inconclusive,
    Settled,
    Cancelled,
    Expired,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, PartialEq, Debug)]
pub enum IndicatorType {
    Temperature,
    Humidity,
    Tamper,
    Shock,
    Uv,
    Biochemical,
    Custom,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, PartialEq, Debug)]
pub enum ResultCode {
    ConditionMet,
    ConditionViolated,
    Inconclusive,
    PendingVerification,
}

#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct BioSealEventLog {
    pub standard: String,
    pub version: String,
    pub event: String,
    pub escrow_id: String,
    pub actor: AccountId,
    pub timestamp_ms: u64,
    pub payload_hash: String,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct VerificationRecord {
    pub session_id: String,
    pub image_hash: String,
    pub model_id: String,
    pub attestation_ref: String,
    pub result_code: ResultCode,
    pub confidence_bps: u32,
    pub timestamp_ms: u64,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct EscrowRecord {
    pub escrow_id: String,
    pub sender_account: AccountId,
    pub recipient_account: AccountId,
    pub claim_recipient_account: Option<AccountId>,
    pub token_asset: String,
    pub token_amount: U128,
    pub policy_hash: String,
    pub indicator_type: IndicatorType,
    pub indicator_binding_hash: String,
    pub deadline_ms: u64,
    pub status: EscrowStatus,
    pub attestation_reference: Option<String>,
    pub result_code: ResultCode,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct BioSealContract {
    pub owner: AccountId,
    pub authorized_tee_enclave: AccountId,
    pub escrows: UnorderedMap<String, EscrowRecord>,
    pub verifications: LookupMap<String, VerificationRecord>,
}

#[near]
impl BioSealContract {
    #[init]
    pub fn new(owner: AccountId, authorized_tee_enclave: AccountId) -> Self {
        require!(!env::state_exists(), "Contract already initialized");
        Self {
            owner,
            authorized_tee_enclave,
            escrows: UnorderedMap::new(b"e"),
            verifications: LookupMap::new(b"v"),
        }
    }

    /// Update TEE enclave address authorized to submit verification attestations
    pub fn set_tee_enclave(&mut self, new_enclave: AccountId) {
        require!(env::predecessor_account_id() == self.owner, "Only owner can update enclave");
        self.authorized_tee_enclave = new_enclave;
    }

    /// Register a new escrow in Draft state
    pub fn create_escrow(
        &mut self,
        escrow_id: String,
        recipient_account: AccountId,
        claim_recipient_account: Option<AccountId>,
        token_asset: String,
        token_amount: U128,
        policy_hash: String,
        indicator_type: IndicatorType,
        indicator_binding_hash: String,
        deadline_ms: u64,
    ) -> EscrowRecord {
        require!(!self.escrows.get(&escrow_id).is_some(), "Escrow ID already exists");
        require!(deadline_ms > env::block_timestamp_ms(), "Deadline must be in the future");
        require!(token_amount.0 > 0, "Amount must be strictly positive");

        let sender = env::predecessor_account_id();
        let now = env::block_timestamp_ms();

        let escrow = EscrowRecord {
            escrow_id: escrow_id.clone(),
            sender_account: sender.clone(),
            recipient_account,
            claim_recipient_account,
            token_asset,
            token_amount,
            policy_hash,
            indicator_type,
            indicator_binding_hash,
            deadline_ms,
            status: EscrowStatus::AwaitingFunding,
            attestation_reference: None,
            result_code: ResultCode::PendingVerification,
            created_at_ms: now,
            updated_at_ms: now,
        };

        self.escrows.insert(&escrow_id, &escrow);

        // Emit NEP-297 compliant event
        self.emit_event(&escrow_id, "ESCROW_CREATED", sender, "0x00");

        escrow
    }

    /// Deposit NEAR tokens to fund an awaiting escrow
    #[payable]
    pub fn fund_escrow_near(&mut self, escrow_id: String) -> EscrowRecord {
        let mut escrow = self.escrows.get(&escrow_id).expect("Escrow not found");
        require!(escrow.status == EscrowStatus::AwaitingFunding, "Escrow is not awaiting funding");
        require!(escrow.token_asset == "NEAR", "Escrow requires NEAR deposit");

        let attached_deposit = env::attached_deposit().as_yoctonear();
        require!(
            attached_deposit >= escrow.token_amount.0,
            "Attached deposit is insufficient for escrow amount"
        );

        escrow.status = EscrowStatus::Active;
        escrow.updated_at_ms = env::block_timestamp_ms();
        self.escrows.insert(&escrow_id, &escrow);

        self.emit_event(&escrow_id, "ESCROW_FUNDED", env::predecessor_account_id(), "0x00");
        escrow
    }

    /// Mark an NEP-141 / USDC escrow as active (called by owner or token vault callback)
    pub fn mark_escrow_funded(&mut self, escrow_id: String) -> EscrowRecord {
        let caller = env::predecessor_account_id();
        let mut escrow = self.escrows.get(&escrow_id).expect("Escrow not found");
        require!(
            caller == self.owner || caller == escrow.sender_account,
            "Unauthorized to mark funded"
        );
        require!(escrow.status == EscrowStatus::AwaitingFunding, "Escrow not awaiting funding");

        escrow.status = EscrowStatus::Active;
        escrow.updated_at_ms = env::block_timestamp_ms();
        self.escrows.insert(&escrow_id, &escrow);

        self.emit_event(&escrow_id, "ESCROW_FUNDED", caller, "0x00");
        escrow
    }

    /// Record a private TEE attestation and settle funds according to condition
    pub fn record_attestation_and_settle(
        &mut self,
        escrow_id: String,
        session_id: String,
        image_hash: String,
        model_id: String,
        attestation_ref: String,
        result_code: ResultCode,
        confidence_bps: u32,
    ) -> EscrowRecord {
        let caller = env::predecessor_account_id();
        require!(
            caller == self.authorized_tee_enclave || caller == self.owner,
            "Only authorized TEE enclave or owner can record attestation"
        );

        let mut escrow = self.escrows.get(&escrow_id).expect("Escrow not found");
        require!(
            escrow.status == EscrowStatus::Active || escrow.status == EscrowStatus::Inconclusive,
            "Escrow is not eligible for verification"
        );
        require!(env::block_timestamp_ms() <= escrow.deadline_ms, "Escrow deadline has passed");

        let now = env::block_timestamp_ms();

        // 1. Record immutable verification record
        let verification = VerificationRecord {
            session_id: session_id.clone(),
            image_hash,
            model_id,
            attestation_ref: attestation_ref.clone(),
            result_code: result_code.clone(),
            confidence_bps,
            timestamp_ms: now,
        };
        self.verifications.insert(&session_id, &verification);

        // 2. Update escrow state and route funds based on physical verdict
        escrow.attestation_reference = Some(attestation_ref);
        escrow.result_code = result_code.clone();
        escrow.updated_at_ms = now;

        match result_code {
            ResultCode::ConditionMet => {
                escrow.status = EscrowStatus::Settled;
                self.escrows.insert(&escrow_id, &escrow);

                // Release payout to recipient
                if escrow.token_asset == "NEAR" {
                    Promise::new(escrow.recipient_account.clone())
                        .transfer(NearToken::from_yoctonear(escrow.token_amount.0));
                }

                self.emit_event(
                    &escrow_id,
                    "ESCROW_SETTLED_MET",
                    escrow.recipient_account.clone(),
                    "payout_released",
                );
            }
            ResultCode::ConditionViolated => {
                escrow.status = EscrowStatus::Settled;
                self.escrows.insert(&escrow_id, &escrow);

                // Route to claim recipient or refund to sender
                let refund_target = escrow
                    .claim_recipient_account
                    .clone()
                    .unwrap_or_else(|| escrow.sender_account.clone());

                if escrow.token_asset == "NEAR" {
                    Promise::new(refund_target.clone())
                        .transfer(NearToken::from_yoctonear(escrow.token_amount.0));
                }

                self.emit_event(
                    &escrow_id,
                    "ESCROW_SETTLED_VIOLATED",
                    refund_target,
                    "violation_routed",
                );
            }
            ResultCode::Inconclusive => {
                escrow.status = EscrowStatus::Inconclusive;
                self.escrows.insert(&escrow_id, &escrow);

                self.emit_event(
                    &escrow_id,
                    "ESCROW_VERIFICATION_INCONCLUSIVE",
                    caller,
                    "awaiting_retry",
                );
            }
            ResultCode::PendingVerification => {
                // No-op for pending
            }
        }

        escrow
    }

    /// Cancel an escrow before it has been funded
    pub fn cancel_escrow(&mut self, escrow_id: String) -> EscrowRecord {
        let caller = env::predecessor_account_id();
        let mut escrow = self.escrows.get(&escrow_id).expect("Escrow not found");
        require!(
            caller == escrow.sender_account || caller == self.owner,
            "Only sender or owner can cancel"
        );
        require!(
            escrow.status == EscrowStatus::Draft || escrow.status == EscrowStatus::AwaitingFunding,
            "Can only cancel unfunded escrows"
        );

        escrow.status = EscrowStatus::Cancelled;
        escrow.updated_at_ms = env::block_timestamp_ms();
        self.escrows.insert(&escrow_id, &escrow);

        self.emit_event(&escrow_id, "ESCROW_CANCELLED", caller, "0x00");
        escrow
    }

    /// Expire escrow if deadline passes
    pub fn expire_escrow(&mut self, escrow_id: String) -> EscrowRecord {
        let mut escrow = self.escrows.get(&escrow_id).expect("Escrow not found");
        require!(env::block_timestamp_ms() > escrow.deadline_ms, "Deadline has not yet passed");
        require!(
            escrow.status == EscrowStatus::Active || escrow.status == EscrowStatus::Inconclusive,
            "Only active or inconclusive escrows can expire"
        );

        if escrow.token_asset == "NEAR" {
            Promise::new(escrow.sender_account.clone())
                .transfer(NearToken::from_yoctonear(escrow.token_amount.0));
        }

        escrow.status = EscrowStatus::Expired;
        escrow.updated_at_ms = env::block_timestamp_ms();
        self.escrows.insert(&escrow_id, &escrow);

        self.emit_event(&escrow_id, "ESCROW_EXPIRED", env::predecessor_account_id(), "refunded_to_sender");
        escrow
    }

    /// View method: Get full public escrow record (minimal latest state onchain)
    pub fn get_escrow(&self, escrow_id: String) -> Option<EscrowRecord> {
        self.escrows.get(&escrow_id)
    }

    /// View method: Get verification proof record
    pub fn get_verification_record(&self, session_id: String) -> Option<VerificationRecord> {
        self.verifications.get(&session_id)
    }

    /// Emits structured event logs to NEAR indexers instead of storing unbounded vectors onchain
    fn emit_event(&self, escrow_id: &String, event_type: &str, actor: AccountId, payload: &str) {
        let event = BioSealEventLog {
            standard: "nep297".to_string(),
            version: "1.0.0".to_string(),
            event: event_type.to_string(),
            escrow_id: escrow_id.clone(),
            actor,
            timestamp_ms: env::block_timestamp_ms(),
            payload_hash: payload.to_string(),
        };
        if let Ok(json) = serde_json::to_string(&event) {
            env::log_str(&format!("EVENT_JSON:{}", json));
        }
    }
}
