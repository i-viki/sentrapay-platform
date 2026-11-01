package dev.jayavignesh.sentrapay.recon.service;

import dev.jayavignesh.sentrapay.recon.entity.Transaction;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Component
public class FuzzyMatcher {

    public record MatchResult(
            boolean isMatched,
            Transaction transaction,
            String matchType,         // "EXACT_MATCH", "FUZZY_MATCH", "AMOUNT_TOLERANCE", "UNMATCHED"
            BigDecimal confidenceScore,
            String reason
    ) {}

    /**
     * Attempts deterministic exact matching, followed by Damerau-Levenshtein string distance
     * and percentage-based fee discrepancy tolerance.
     */
    public MatchResult evaluateMatch(String statementUtr, BigDecimal statementAmount, List<Transaction> candidates) {
        if (statementUtr == null || statementAmount == null || candidates == null || candidates.isEmpty()) {
            return new MatchResult(false, null, "UNMATCHED", BigDecimal.ZERO, "No candidates available for reconciliation");
        }

        String normStmtUtr = normalizeUtr(statementUtr);

        // Stage 1: Exact UTR and Exact Amount (100% confidence)
        for (Transaction tx : candidates) {
            if (tx.getClaimedUtr() != null) {
                String normClaimedUtr = normalizeUtr(tx.getClaimedUtr());
                if (normStmtUtr.equals(normClaimedUtr) && statementAmount.compareTo(tx.getAmount()) == 0) {
                    return new MatchResult(
                            true,
                            tx,
                            "EXACT_MATCH",
                            new BigDecimal("1.00"),
                            "Exact UTR and amount match"
                    );
                }
            }
        }

        // Stage 2: Exact UTR with minor Amount Discrepancy (e.g. gateway fee <= 2%)
        for (Transaction tx : candidates) {
            if (tx.getClaimedUtr() != null) {
                String normClaimedUtr = normalizeUtr(tx.getClaimedUtr());
                if (normStmtUtr.equals(normClaimedUtr)) {
                    BigDecimal diff = statementAmount.subtract(tx.getAmount()).abs();
                    BigDecimal percentDiff = diff.divide(tx.getAmount(), 4, RoundingMode.HALF_UP);
                    if (percentDiff.compareTo(new BigDecimal("0.025")) <= 0) {
                        return new MatchResult(
                                true,
                                tx,
                                "AMOUNT_TOLERANCE",
                                new BigDecimal("0.92"),
                                String.format("Exact UTR match with %s fee difference", diff)
                        );
                    }
                }
            }
        }

        // Stage 3: Fuzzy UTR (Levenshtein distance <= 2) and matching Amount
        MatchResult bestFuzzy = null;
        int minDistance = Integer.MAX_VALUE;

        for (Transaction tx : candidates) {
            if (tx.getClaimedUtr() != null) {
                String normClaimedUtr = normalizeUtr(tx.getClaimedUtr());
                int dist = damerauLevenshteinDistance(normStmtUtr, normClaimedUtr);

                if (dist <= 2) {
                    // Check amount equality or proximity
                    boolean exactAmt = statementAmount.compareTo(tx.getAmount()) == 0;
                    if (exactAmt && dist < minDistance) {
                        minDistance = dist;
                        double score = 1.0 - (0.10 * dist);
                        bestFuzzy = new MatchResult(
                                true,
                                tx,
                                "FUZZY_MATCH",
                                BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP),
                                String.format("Fuzzy UTR match (distance=%d) with identical amount", dist)
                        );
                    }
                }
            }
        }

        if (bestFuzzy != null) {
            return bestFuzzy;
        }

        return new MatchResult(false, null, "UNMATCHED", BigDecimal.ZERO, "No matching claimed UTR found within tolerance limits");
    }

    public static String normalizeUtr(String utr) {
        if (utr == null) return "";
        return utr.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    /**
     * Damerau-Levenshtein distance handles insertions, deletions, substitutions,
     * and transpositions of adjacent characters (common typing errors).
     */
    public static int damerauLevenshteinDistance(CharSequence source, CharSequence target) {
        if (source == null || target == null) return Integer.MAX_VALUE;
        int srcLen = source.length();
        int tgtLen = target.length();

        if (srcLen == 0) return tgtLen;
        if (tgtLen == 0) return srcLen;

        int[][] dp = new int[srcLen + 1][tgtLen + 1];

        for (int i = 0; i <= srcLen; i++) dp[i][0] = i;
        for (int j = 0; j <= tgtLen; j++) dp[0][j] = j;

        for (int i = 1; i <= srcLen; i++) {
            for (int j = 1; j <= tgtLen; j++) {
                int cost = (source.charAt(i - 1) == target.charAt(j - 1)) ? 0 : 1;

                dp[i][j] = Math.min(
                        dp[i - 1][j] + 1, // deletion
                        Math.min(
                                dp[i][j - 1] + 1, // insertion
                                dp[i - 1][j - 1] + cost // substitution
                        )
                );

                // Check transposition
                if (i > 1 && j > 1 &&
                        source.charAt(i - 1) == target.charAt(j - 2) &&
                        source.charAt(i - 2) == target.charAt(j - 1)) {
                    dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
                }
            }
        }

        return dp[srcLen][tgtLen];
    }
}

