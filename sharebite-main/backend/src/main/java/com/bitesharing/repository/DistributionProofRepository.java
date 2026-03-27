package com.bitesharing.repository;

import com.bitesharing.model.DistributionProof;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DistributionProofRepository extends JpaRepository<DistributionProof, Long> {
    List<DistributionProof> findByRequestId(Long requestId);
}

