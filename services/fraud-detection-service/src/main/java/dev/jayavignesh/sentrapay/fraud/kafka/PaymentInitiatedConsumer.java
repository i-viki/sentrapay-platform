package dev.jayavignesh.sentrapay.fraud.kafka;

import dev.jayavignesh.sentrapay.events.FraudScoredEvent;
import dev.jayavignesh.sentrapay.events.PaymentInitiatedEvent;
import dev.jayavignesh.sentrapay.fraud.service.FraudRuleEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class PaymentInitiatedConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentInitiatedConsumer.class);
    private static final String TOPIC_PAYMENTS_FRAUD_SCORED = "payments.fraud-scored";

    private final FraudRuleEngine fraudRuleEngine;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PaymentInitiatedConsumer(FraudRuleEngine fraudRuleEngine, KafkaTemplate<String, Object> kafkaTemplate) {
        this.fraudRuleEngine = fraudRuleEngine;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(
            topics = "payments.initiated",
            groupId = "${spring.kafka.consumer.group-id:sentrapay-fraud-group}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumePaymentInitiated(PaymentInitiatedEvent event) {
        log.info("Processing PaymentInitiatedEvent for reference: {}", event.paymentReference());

        try {
            FraudScoredEvent scoredEvent = fraudRuleEngine.evaluate(event);

            log.info("Emitting FraudScoredEvent to {}: ref={}, verdict={}",
                    TOPIC_PAYMENTS_FRAUD_SCORED, scoredEvent.paymentReference(), scoredEvent.verdict());

            kafkaTemplate.send(TOPIC_PAYMENTS_FRAUD_SCORED, scoredEvent.paymentReference(), scoredEvent);

        } catch (Exception e) {
            log.error("Failed to evaluate and publish fraud score for ref {}: {}", event.paymentReference(), e.getMessage(), e);
        }
    }
}

