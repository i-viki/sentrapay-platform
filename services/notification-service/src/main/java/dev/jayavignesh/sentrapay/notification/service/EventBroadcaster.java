package dev.jayavignesh.sentrapay.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;

@Service
public class EventBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(EventBroadcaster.class);

    private final Sinks.Many<ServerSentEvent<String>> sink = Sinks.many().multicast().directBestEffort();

    public void broadcast(String eventName, String payloadJson) {
        log.info("Broadcasting SSE event: {}", eventName);
        ServerSentEvent<String> event = ServerSentEvent.<String>builder()
                .event(eventName)
                .data(payloadJson)
                .build();

        Sinks.EmitResult result = sink.tryEmitNext(event);
        if (result.isFailure() && result != Sinks.EmitResult.FAIL_ZERO_SUBSCRIBER) {
            log.warn("Failed to broadcast SSE event {}: {}", eventName, result);
        }
    }

    public Flux<ServerSentEvent<String>> getStream() {
        Flux<ServerSentEvent<String>> heartbeat = Flux.interval(Duration.ofSeconds(15))
                .map(i -> ServerSentEvent.<String>builder()
                        .event("ping")
                        .data("{\"type\":\"keepalive\"}")
                        .build());

        return Flux.merge(sink.asFlux(), heartbeat);
    }
}

