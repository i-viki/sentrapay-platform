package dev.jayavignesh.sentrapay.fraud.service;

import dev.jayavignesh.sentrapay.events.FraudScoredEvent;
import dev.jayavignesh.sentrapay.events.PaymentInitiatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class FraudRuleEngine {

    private static final Logger log = LoggerFactory.getLogger(FraudRuleEngine.class);

    private final RedisVelocityEvaluator velocityEvaluator;
    private final MlInferenceClient mlClient;

    public FraudRuleEngine(RedisVelocityEvaluator velocityEvaluator, MlInferenceClient mlClient) {
        this.velocityEvaluator = velocityEvaluator;
        this.mlClient = mlClient;
    }

    public FraudScoredEvent evaluate(PaymentInitiatedEvent event) {
        log.info("Evaluating payment risk for ref: {}, amount: {} {}",
                event.paymentReference(), event.amount(), event.currency());

        // 1. Sliding window velocity evaluation
        var velocity = velocityEvaluator.recordAndEvaluate(event.senderWalletId(), event.paymentReference());

        // 2. Invoke ML Inference Sidecar
        var mlResult = mlClient.evaluateRisk(
                event.paymentReference(),
                event.amount().doubleValue(),
                velocity.countLast1m(),
                velocity.countLast1h(),
                event.channel()
        );

        List<String> flags = new ArrayList<>(mlResult.flaggedIndicators());
        double finalScore = mlResult.fraudProbability();
        String riskTier = mlResult.riskTier();
        String verdict = "APPROVED";

        // 3. Deterministic rule layer overlay
        if (velocity.countLast1m() > 5) {
            flags.add("BURST_VELOCITY_SPIKE_EXCEEDED");
            verdict = "REJECTED";
            riskTier = "HIGH";
            finalScore = Math.max(finalScore, 0.92);
        } else if (velocity.countLast1m() > 3) {
            flags.add("ELEVATED_VELOCITY_WARNING");
            if (!"REJECTED".equals(verdict)) {
                verdict = "MANUAL_REVIEW";
                riskTier = "MEDIUM";
                finalScore = Math.max(finalScore, 0.55);
            }
        }

        if (event.amount().doubleValue() > 100000.0) {
            flags.add("HIGH_VALUE_TRANSACTION_THRESHOLD");
            if (!"REJECTED".equals(verdict)) {
                verdict = "MANUAL_REVIEW";
                riskTier = "MEDIUM";
                finalScore = Math.max(finalScore, 0.45);
            }
        }

        // Align verdict with ML high confidence
        if (finalScore >= 0.70) {
            verdict = "REJECTED";
            riskTier = "HIGH";
        } else if (finalScore >= 0.25 && !"REJECTED".equals(verdict)) {
            verdict = "MANUAL_REVIEW";
            riskTier = "MEDIUM";
        }

        log.info("Risk assessment complete for {}: verdict={}, tier={}, prob={}",
                event.paymentReference(), verdict, riskTier, finalScore);

        return new FraudScoredEvent(
                event.paymentReference(),
                event.senderWalletId(),
                event.recipientWalletId(),
                event.amount(),
                finalScore,
                riskTier,
                verdict,
                flags,
                mlResult.inferenceTimeNanos(),
                Instant.now()
        );
    }
}

