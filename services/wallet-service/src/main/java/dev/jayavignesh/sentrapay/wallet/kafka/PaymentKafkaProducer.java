package dev.jayavignesh.sentrapay.wallet.kafka;

import dev.jayavignesh.sentrapay.events.PaymentInitiatedEvent;
import dev.jayavignesh.sentrapay.events.PaymentSettledEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class PaymentKafkaProducer {

    private static final Logger log = LoggerFactory.getLogger(PaymentKafkaProducer.class);

    private static final String TOPIC_PAYMENTS_INITIATED = "payments.initiated";
    private static final String TOPIC_PAYMENTS_SETTLED = "payments.settled";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PaymentKafkaProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendPaymentInitiated(PaymentInitiatedEvent event) {
        log.info("Publishing PaymentInitiatedEvent for reference: {}", event.paymentReference());
        kafkaTemplate.send(TOPIC_PAYMENTS_INITIATED, event.paymentReference(), event);
    }

    public void sendPaymentSettled(PaymentSettledEvent event) {
        log.info("Publishing PaymentSettledEvent for reference: {} [status={}]", event.paymentReference(), event.status());
        kafkaTemplate.send(TOPIC_PAYMENTS_SETTLED, event.paymentReference(), event);
    }
}

