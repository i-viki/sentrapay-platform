package dev.jayavignesh.sentrapay.notification.controller;

import dev.jayavignesh.sentrapay.notification.service.EventBroadcaster;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventStreamController {

    private final EventBroadcaster eventBroadcaster;

    public EventStreamController(EventBroadcaster eventBroadcaster) {
        this.eventBroadcaster = eventBroadcaster;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamEvents() {
        return eventBroadcaster.getStream();
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "service", "notification-service",
                "transport", "Server-Sent Events (SSE)",
                "status", "STREAMING"
        ));
    }
}

