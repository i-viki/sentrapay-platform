package dev.jayavignesh.sentrapay.wallet.kafka;

import dev.jayavignesh.sentrapay.events.FraudScoredEvent;
import dev.jayavignesh.sentrapay.events.PaymentSettledEvent;
import dev.jayavignesh.sentrapay.wallet.entity.BalanceHold;
import dev.jayavignesh.sentrapay.wallet.entity.Transaction;
import dev.jayavignesh.sentrapay.wallet.repository.BalanceHoldRepository;
import dev.jayavignesh.sentrapay.wallet.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Component
public class FraudVerdictConsumer {

    private static final Logger log = LoggerFactory.getLogger(FraudVerdictConsumer.class);

    private final TransactionRepository transactionRepository;
    private final BalanceHoldRepository balanceHoldRepository;
    private final PaymentKafkaProducer kafkaProducer;

    public FraudVerdictConsumer(
            TransactionRepository transactionRepository,
            BalanceHoldRepository balanceHoldRepository,
            PaymentKafkaProducer kafkaProducer
    ) {
        this.transactionRepository = transactionRepository;
        this.balanceHoldRepository = balanceHoldRepository;
        this.kafkaProducer = kafkaProducer;
    }

    @KafkaListener(
            topics = "payments.fraud-scored",
            groupId = "${spring.kafka.consumer.group-id:wallet-service-group}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional
    public void handleFraudVerdict(FraudScoredEvent event) {
        log.info("Received FraudScoredEvent for ref: {}, verdict: {}, probability: {}",
                event.paymentReference(), event.verdict(), event.fraudProbability());

        var txOpt = transactionRepository.findByPaymentReference(event.paymentReference());
        if (txOpt.isEmpty()) {
            log.error("Transaction not found for payment reference: {}", event.paymentReference());
            return;
        }

        Transaction tx = txOpt.get();
        tx.setRiskScore(BigDecimal.valueOf(event.fraudProbability()));
        tx.setRiskTier(event.riskTier());
        tx.setUpdatedAt(Instant.now());

        var holdOpt = balanceHoldRepository.findByPaymentReference(event.paymentReference());

        if ("APPROVED".equalsIgnoreCase(event.verdict())) {
            tx.setStatus("SETTLED");
            holdOpt.ifPresent(hold -> {
                hold.setStatus("COMMITTED");
                balanceHoldRepository.save(hold);
            });
            transactionRepository.save(tx);

            kafkaProducer.sendPaymentSettled(new PaymentSettledEvent(
                    tx.getPaymentReference(),
                    tx.getSenderWallet().getId(),
                    tx.getRecipientWallet().getId(),
                    tx.getAmount(),
                    tx.getCurrency(),
                    "SETTLED",
                    null,
                    Instant.now()
            ));

        } else if ("REJECTED".equalsIgnoreCase(event.verdict())) {
            tx.setStatus("FAILED");
            String reason = "AI_FRAUD_REJECTED: " + String.join(", ", event.flaggedIndicators());
            tx.setFailureReason(reason);
            // Compensating action: release the reserved balance hold
            holdOpt.ifPresent(hold -> {
                hold.setStatus("RELEASED");
                balanceHoldRepository.save(hold);
            });
            transactionRepository.save(tx);

            kafkaProducer.sendPaymentSettled(new PaymentSettledEvent(
                    tx.getPaymentReference(),
                    tx.getSenderWallet().getId(),
                    tx.getRecipientWallet().getId(),
                    tx.getAmount(),
                    tx.getCurrency(),
                    "FAILED",
                    reason,
                    Instant.now()
            ));

        } else {
            // MANUAL_REVIEW: Hold remains ACTIVE
            tx.setStatus("MANUAL_REVIEW");
            tx.setFailureReason("SUSPICIOUS_ACTIVITY: flagged for compliance investigation");
            transactionRepository.save(tx);
        }
    }
}

