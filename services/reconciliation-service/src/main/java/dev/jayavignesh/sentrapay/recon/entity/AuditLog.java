package dev.jayavignesh.sentrapay.recon.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "entity_name", nullable = false, length = 50)
    private String entityName;

    @Column(name = "entity_id", nullable = false, length = 50)
    private String entityId;

    @Column(name = "performed_by")
    private Long performedBy;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "log_payload", nullable = false, columnDefinition = "TEXT")
    private String logPayload;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "record_hash", nullable = false, length = 64)
    private String recordHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AuditLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public Long getPerformedBy() { return performedBy; }
    public void setPerformedBy(Long performedBy) { this.performedBy = performedBy; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getLogPayload() { return logPayload; }
    public void setLogPayload(String logPayload) { this.logPayload = logPayload; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getRecordHash() { return recordHash; }
    public void setRecordHash(String recordHash) { this.recordHash = recordHash; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

