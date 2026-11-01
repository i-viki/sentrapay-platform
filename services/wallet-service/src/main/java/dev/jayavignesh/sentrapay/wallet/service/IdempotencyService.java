package dev.jayavignesh.sentrapay.wallet.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class IdempotencyService {

    private static final String IDEMPOTENCY_PREFIX = "idempotency:";
    private static final Duration DEFAULT_TTL = Duration.ofHours(24);

    private final StringRedisTemplate redisTemplate;

    public IdempotencyService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Attempts to acquire an idempotency lock for the given key.
     * @param idempotencyKey The unique key sent by the client.
     * @param paymentReference The generated payment reference to associate.
     * @return true if lock acquired (new request), false if key already processed or in-flight.
     */
    public boolean acquire(String idempotencyKey, String paymentReference) {
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            return false;
        }
        String redisKey = IDEMPOTENCY_PREFIX + idempotencyKey.trim();
        Boolean success = redisTemplate.opsForValue().setIfAbsent(redisKey, paymentReference, DEFAULT_TTL);
        return Boolean.TRUE.equals(success);
    }

    /**
     * Retrieves the existing payment reference associated with the idempotency key if present.
     */
    public String getExistingReference(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            return null;
        }
        return redisTemplate.opsForValue().get(IDEMPOTENCY_PREFIX + idempotencyKey.trim());
    }
}

