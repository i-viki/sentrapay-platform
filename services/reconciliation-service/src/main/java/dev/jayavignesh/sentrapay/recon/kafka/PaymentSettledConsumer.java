package dev.jayavignesh.sentrapay.recon.kafka;

import dev.jayavignesh.sentrapay.events.PaymentSettledEvent;
import dev.jayavignesh.sentrapay.recon.entity.Transaction;
import dev.jayavignesh.sentrapay.recon.repository.ReconTransactionRepository;
import dev.jayavignesh.sentrapay.recon.service.GeneralLedgerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentSettledConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentSettledConsumer.class);

    private final ReconTransactionRepository transactionRepository;
    private final GeneralLedgerService generalLedgerService;

    public PaymentSettledConsumer(
            ReconTransactionRepository transactionRepository,
            GeneralLedgerService generalLedgerService
    ) {
        this.transactionRepository = transactionRepository;
        this.generalLedgerService = generalLedgerService;
    }

    @KafkaListener(
            topics = "payments.settled",
            groupId = "${spring.kafka.consumer.group-id:sentrapay-recon-group}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional
    public void consumePaymentSettled(PaymentSettledEvent event) {
        log.info("Received PaymentSettledEvent for ref: {}, status: {}", event.paymentReference(), event.status());

        if ("SETTLED".equalsIgnoreCase(event.status())) {
            var txOpt = transactionRepository.findByPaymentReference(event.paymentReference());
            if (txOpt.isPresent()) {
                Transaction tx = txOpt.get();
                generalLedgerService.postDoubleEntry(tx.getId(), tx.getPaymentReference(), event.amount());
            } else {
                log.warn("Transaction reference {} not found in database for double-entry posting", event.paymentReference());
            }
        }
    }
}

