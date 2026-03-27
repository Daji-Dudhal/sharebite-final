package com.bitesharing.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "distribution_proof")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistributionProof {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    @Column(name = "photo_url", nullable = false, length = 500)
    private String photoUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "distributed_to_count")
    private Integer distributedToCount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

