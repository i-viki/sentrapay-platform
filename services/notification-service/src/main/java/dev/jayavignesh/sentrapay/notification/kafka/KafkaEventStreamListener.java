package dev.jayavignesh.sentrapay.notification.kafka;

import dev.jayavignesh.sentrapay.notification.service.EventBroadcaster;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class KafkaEventStreamListener {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventStreamListener.class);

    private final EventBroadcaster eventBroadcaster;

    public KafkaEventStreamListener(EventBroadcaster eventBroadcaster) {
        this.eventBroadcaster = eventBroadcaster;
    }

    @KafkaListener(
            topics = {"payments.initiated", "payments.fraud-scored", "payments.settled", "recon.matched"},
            groupId = "${spring.kafka.consumer.group-id:sentrapay-notification-group}"
    )
    public void onKafkaRecord(ConsumerRecord<String, String> record) {
        String topic = record.topic();
        String payload = record.value();

        String eventName = switch (topic) {
            case "payments.initiated" -> "payment.initiated";
            case "payments.fraud-scored" -> "fraud.evaluated";
            case "payments.settled" -> "payment.settled";
            case "recon.matched" -> "recon.matched";
            default -> "stream.event";
        };

        log.info("Received event on topic [{}], broadcasting as SSE event [{}]", topic, eventName);
        eventBroadcaster.broadcast(eventName, payload);
    }
}

