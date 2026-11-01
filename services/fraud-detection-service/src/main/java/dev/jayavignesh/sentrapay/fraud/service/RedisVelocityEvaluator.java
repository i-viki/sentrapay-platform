package dev.jayavignesh.sentrapay.fraud.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RedisVelocityEvaluator {

    private static final Logger log = LoggerFactory.getLogger(RedisVelocityEvaluator.class);
    private static final String VELOCITY_PREFIX = "velocity:sender:";

    private final StringRedisTemplate redisTemplate;

    public record VelocityMetrics(long countLast1m, long countLast10m, long countLast1h) {}

    public RedisVelocityEvaluator(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public VelocityMetrics recordAndEvaluate(long senderWalletId, String paymentReference) {
        String key = VELOCITY_PREFIX + senderWalletId;
        long nowMs = System.currentTimeMillis();
        String member = paymentReference + ":" + nowMs;

        try {
            // 1. Record transaction in ZSET with epoch timestamp as score
            redisTemplate.opsForZSet().add(key, member, (double) nowMs);
            redisTemplate.expire(key, Duration.ofHours(2));

            // 2. Trim expired timestamps older than 1 hour
            long oneHourAgo = nowMs - 3600_000L;
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, (double) oneHourAgo);

            // 3. Count sliding windows
            long count1m = countBetween(key, nowMs - 60_000L, nowMs);
            long count10m = countBetween(key, nowMs - 600_000L, nowMs);
            long count1h = countBetween(key, oneHourAgo, nowMs);

            log.debug("Sender {} velocity: 1m={}, 10m={}, 1h={}", senderWalletId, count1m, count10m, count1h);
            return new VelocityMetrics(count1m, count10m, count1h);

        } catch (Exception e) {
            log.warn("Redis velocity check failed, falling back to nominal metrics: {}", e.getMessage());
            return new VelocityMetrics(1, 1, 1);
        }
    }

    private long countBetween(String key, long startMs, long endMs) {
        Long count = redisTemplate.opsForZSet().count(key, (double) startMs, (double) endMs);
        return count != null ? count : 0L;
    }
}

